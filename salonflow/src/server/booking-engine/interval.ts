/**
 * Half-open time intervals, `[start, end)`.
 *
 * Half-open is not a stylistic choice — it is what makes "ends at 10:00" and
 * "starts at 10:00" non-conflicting, and it matches the `'[)'` bound used by
 * the PostgreSQL exclusion constraints that back these calculations.
 */

export interface Interval {
  start: Date;
  end: Date;
}

export function makeInterval(start: Date, end: Date): Interval {
  return { start, end };
}

export function isEmpty(interval: Interval): boolean {
  return interval.start.getTime() >= interval.end.getTime();
}

/** True when the two intervals share at least one instant. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

/** True when `outer` fully covers `inner`. */
export function contains(outer: Interval, inner: Interval): boolean {
  return (
    outer.start.getTime() <= inner.start.getTime() && inner.end.getTime() <= outer.end.getTime()
  );
}

export function overlapsAny(target: Interval, others: readonly Interval[]): boolean {
  return others.some((other) => overlaps(target, other));
}

/** Sort ascending by start, then by end. */
export function sortIntervals(intervals: readonly Interval[]): Interval[] {
  return [...intervals].sort(
    (a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime(),
  );
}

/** Merge overlapping and touching intervals into a minimal covering set. */
export function mergeIntervals(intervals: readonly Interval[]): Interval[] {
  const sorted = sortIntervals(intervals.filter((interval) => !isEmpty(interval)));
  const merged: Interval[] = [];

  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (last && interval.start.getTime() <= last.end.getTime()) {
      if (interval.end.getTime() > last.end.getTime()) {
        last.end = interval.end;
      }
    } else {
      merged.push({ start: interval.start, end: interval.end });
    }
  }

  return merged;
}

/** Remove `holes` from `base`, returning the remaining fragments. */
export function subtractIntervals(
  base: readonly Interval[],
  holes: readonly Interval[],
): Interval[] {
  const merged = mergeIntervals(holes);
  let current = mergeIntervals(base);

  for (const hole of merged) {
    const next: Interval[] = [];
    for (const part of current) {
      if (!overlaps(part, hole)) {
        next.push(part);
        continue;
      }
      if (part.start.getTime() < hole.start.getTime()) {
        next.push({ start: part.start, end: hole.start });
      }
      if (hole.end.getTime() < part.end.getTime()) {
        next.push({ start: hole.end, end: part.end });
      }
    }
    current = next;
  }

  return current.filter((interval) => !isEmpty(interval));
}

/** Intersection of two interval sets. */
export function intersectIntervals(a: readonly Interval[], b: readonly Interval[]): Interval[] {
  const result: Interval[] = [];
  for (const left of mergeIntervals(a)) {
    for (const right of mergeIntervals(b)) {
      const start = new Date(Math.max(left.start.getTime(), right.start.getTime()));
      const end = new Date(Math.min(left.end.getTime(), right.end.getTime()));
      if (start.getTime() < end.getTime()) result.push({ start, end });
    }
  }
  return sortIntervals(result);
}

/** True when every interval in `needles` is covered by `haystack`. */
export function coveredBy(needles: readonly Interval[], haystack: readonly Interval[]): boolean {
  const merged = mergeIntervals(haystack);
  return needles.every((needle) => merged.some((window) => contains(window, needle)));
}

export function shiftInterval(interval: Interval, minutes: number): Interval {
  return {
    start: new Date(interval.start.getTime() + minutes * 60_000),
    end: new Date(interval.end.getTime() + minutes * 60_000),
  };
}

export function intervalMinutes(interval: Interval): number {
  return Math.round((interval.end.getTime() - interval.start.getTime()) / 60_000);
}
