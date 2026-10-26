/**
 * Password digest: the typed password never leaves the browser.
 *
 * Every request that carries a password sends this digest instead (PBKDF2-HMAC-SHA256,
 * 100 000 iterations, salt `syncfit:<lower-cased email>`, 64 hex chars), so the network
 * tab shows no readable password. The backend hashes the digest again with Argon2.
 * Keep the algorithm identical to `app/services/credentials.py` in syncfit-backend.
 */

const ITERATIONS = 100_000;
const SALT_PREFIX = "syncfit:";

export async function hashPassword(email: string, password: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error("crypto.unavailable");
  const encoder = new TextEncoder();
  const key = await subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(`${SALT_PREFIX}${email.trim().toLowerCase()}`), iterations: ITERATIONS },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
