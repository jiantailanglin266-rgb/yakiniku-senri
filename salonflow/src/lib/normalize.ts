/**
 * Normalisation helpers used for duplicate detection and search.
 *
 * Salon staff enter the same customer many different ways over the years:
 * `090-1234-5678`, `09012345678`, `+81 90 1234 5678`. Normalised forms make
 * those collapse into one comparable key without destroying what was typed —
 * the original is always stored alongside.
 */

/** Convert full-width ASCII and full-width katakana punctuation to half-width. */
export function toHalfWidth(value: string): string {
  return value
    .replace(/[！-～]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ");
}

/** Convert half-width katakana to full-width, then hiragana to katakana. */
export function toKatakana(value: string): string {
  return value.replace(/[ぁ-ゖ]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 0x60));
}

/**
 * Normalise a Japanese phone number to digits, preserving the distinction
 * between a domestic and an international form.
 *
 * `+81 90-1234-5678` and `090-1234-5678` both become `+819012345678`, so the
 * same person entered twice is detected as a duplicate.
 */
export function normalizePhone(
  value: string | null | undefined,
  defaultCountry = "81",
): string | null {
  if (!value) return null;

  const cleaned = toHalfWidth(value).replace(/[^\d+]/g, "");
  if (cleaned.length === 0) return null;

  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    return digits.length > 0 ? `+${digits}` : null;
  }

  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Domestic numbers carry a leading trunk `0` that the country code replaces.
  if (digits.startsWith("0")) {
    return `+${defaultCountry}${digits.slice(1)}`;
  }

  // Already in country-code form without the plus, or a short/extension number.
  if (digits.startsWith(defaultCountry) && digits.length > defaultCountry.length + 6) {
    return `+${digits}`;
  }

  return digits;
}

/**
 * Normalise an email for comparison: lower-case, trimmed, full-width folded.
 *
 * Deliberately does NOT strip dots or `+tags` — those are provider-specific
 * conventions and treating `a.b@example.com` as `ab@example.com` would merge
 * two genuinely different people on providers that distinguish them.
 */
export function normalizeEmail(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = toHalfWidth(value).trim().toLowerCase();
  return cleaned.length > 0 ? cleaned : null;
}

/** Collapse whitespace and fold width for name comparison. */
export function normalizeName(value: string | null | undefined): string | null {
  if (!value) return null;
  const cleaned = toHalfWidth(value).replace(/\s+/g, "").trim();
  return cleaned.length > 0 ? cleaned : null;
}

/** Normalised kana key used for the "search by reading" behaviour staff expect. */
export function normalizeKana(value: string | null | undefined): string | null {
  const name = normalizeName(value);
  return name ? toKatakana(name) : null;
}

/**
 * Score how likely two customer records are the same person, 0–100.
 *
 * Intentionally conservative: an exact phone or email match is strong
 * evidence, a name match alone is not. The threshold for *suggesting* a merge
 * is 60; merging itself always requires an explicit human decision.
 */
export interface DuplicateCandidate {
  name?: string | null;
  nameKana?: string | null;
  phoneNormalized?: string | null;
  emailNormalized?: string | null;
  birthDate?: Date | null;
}

export function duplicateScore(a: DuplicateCandidate, b: DuplicateCandidate): number {
  let score = 0;

  if (a.phoneNormalized && b.phoneNormalized && a.phoneNormalized === b.phoneNormalized) {
    score += 55;
  }
  if (a.emailNormalized && b.emailNormalized && a.emailNormalized === b.emailNormalized) {
    score += 45;
  }

  const nameA = normalizeName(a.name);
  const nameB = normalizeName(b.name);
  if (nameA && nameB && nameA === nameB) score += 25;

  const kanaA = normalizeKana(a.nameKana);
  const kanaB = normalizeKana(b.nameKana);
  if (kanaA && kanaB && kanaA === kanaB) score += 15;

  if (a.birthDate && b.birthDate && a.birthDate.getTime() === b.birthDate.getTime()) {
    score += 20;
  }

  return Math.min(100, score);
}

export const DUPLICATE_SUGGEST_THRESHOLD = 60;
