import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

/**
 * `promisify` collapses `scrypt`'s overloads and drops the options argument,
 * so the promise wrapper is written out explicitly to keep `N`, `r`, `p` and
 * `maxmem` type-checked.
 */
function scrypt(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, keylen, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

/**
 * Password hashing with scrypt.
 *
 * Deliberately free of the `server-only` marker so the database seed script
 * can create the demo login with the same algorithm the app verifies against.
 * Importing `node:crypto` already makes this unusable from a browser bundle.
 *
 * scrypt ships with Node, is memory-hard, and needs no native build step —
 * which matters because a failed `argon2` compile at deploy time would take
 * authentication down. Parameters follow the OWASP minimum for scrypt
 * (N=2^16, r=8, p=1).
 *
 * Stored format: `scrypt$N$r$p$saltHex$hashHex`
 */
const SCRYPT_N = 1 << 16;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

// scrypt's memory use is roughly 128 * N * r bytes; Node's default 32 MiB cap
// is below what N=2^16, r=8 needs, so it is raised explicitly.
const MAX_MEMORY = 128 * SCRYPT_N * SCRYPT_R * 2;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: MAX_MEMORY,
  });

  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("hex"),
    derived.toString("hex"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4] ?? "", "hex");
  const expected = Buffer.from(parts[5] ?? "", "hex");

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  if (salt.length === 0 || expected.length === 0) return false;

  try {
    const derived = await scrypt(password.normalize("NFKC"), salt, expected.length, {
      N,
      r,
      p,
      maxmem: 128 * N * r * 2,
    });

    // Constant-time comparison: a length check first, because
    // timingSafeEqual throws on mismatched lengths.
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export interface PasswordPolicyResult {
  ok: boolean;
  problems: string[];
}

/**
 * Minimum password policy.
 *
 * Length is weighted over composition rules, per NIST SP 800-63B. Phase 1 has
 * no MFA, so this is the only barrier — see risk R-08.
 */
export function checkPasswordPolicy(password: string): PasswordPolicyResult {
  const problems: string[] = [];

  if (password.length < 12) problems.push("password.too_short");
  if (password.length > 200) problems.push("password.too_long");
  if (!/[a-z]/.test(password) && !/[A-Z]/.test(password)) problems.push("password.needs_letter");
  if (!/\d/.test(password)) problems.push("password.needs_digit");

  const trivial = ["password", "12345678", "qwertyui", "salonflow", "adminadmin"];
  if (trivial.some((entry) => password.toLowerCase().includes(entry))) {
    problems.push("password.too_common");
  }

  return { ok: problems.length === 0, problems };
}
