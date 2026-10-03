import "server-only";

/** The app-wide secret for signing sessions and hashing OTP codes. */
export function appSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return s;
}
