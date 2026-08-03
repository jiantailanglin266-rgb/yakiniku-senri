import "server-only";

/**
 * Fixed-window rate limiting.
 *
 * Phase 1 keeps counters in process memory. That is honest but limited: with
 * more than one server instance each gets its own budget. Moving the store to
 * Redis is a Phase 3 task and only requires replacing `hit()` — every caller
 * uses the same interface. See risk R-16.
 */

interface Counter {
  count: number;
  resetAt: number;
}

const counters = new Map<string, Counter>();

/** Drop expired counters so a long-running process does not grow unbounded. */
function sweep(now: number): void {
  if (counters.size < 5_000) return;
  for (const [key, counter] of counters) {
    if (counter.resetAt <= now) counters.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  /** Seconds the caller should wait before retrying. */
  retryAfterSeconds: number;
}

export function hit(key: string, limit: number, windowSeconds = 60): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = counters.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    counters.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: new Date(resetAt),
      retryAfterSeconds: 0,
    };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;

  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    resetAt: new Date(existing.resetAt),
    retryAfterSeconds: allowed ? 0 : Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Test helper — clears every counter. */
export function resetRateLimits(): void {
  counters.clear();
}

/**
 * Build a bucket key.
 *
 * The identity component should be the most specific thing available (user id,
 * then IP), so a single noisy client cannot exhaust everyone else's budget.
 */
export function rateLimitKey(scope: string, identity: string | null | undefined): string {
  return `${scope}:${identity ?? "anonymous"}`;
}
