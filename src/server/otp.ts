import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, otpCodes } from "@/db/schema";
import { appSecret } from "@/lib/secret";
import { smsProvider } from "@/lib/sms";

const CODE_TTL_MIN = 5;
const MAX_ATTEMPTS = 5; // wrong guesses allowed per code
const MAX_SENDS_PER_WINDOW = 3; // codes per phone per window
const SEND_WINDOW_MIN = 15;

function hashCode(phone: string, code: string): string {
  return createHmac("sha256", appSecret()).update(`${phone}:${code}`).digest("hex");
}

export type RequestOtpResult = { ok: true; devCode?: string } | { ok: false; error: "rate_limited" };

/** Creates a 6-digit code for `phone` and sends it by SMS. */
export async function requestOtp(phone: string, now = new Date()): Promise<RequestOtpResult> {
  const windowStart = new Date(now.getTime() - SEND_WINDOW_MIN * 60_000);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, windowStart)));
  if (count >= MAX_SENDS_PER_WINDOW) return { ok: false, error: "rate_limited" };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(otpCodes).values({
    phone,
    codeHash: hashCode(phone, code),
    expiresAt: new Date(now.getTime() + CODE_TTL_MIN * 60_000),
    createdAt: now,
  });
  await smsProvider().send(phone, `KLINIQUE code: ${code}. Valid for ${CODE_TTL_MIN} minutes.`);

  return { ok: true, devCode: process.env.OTP_DEV_ECHO === "true" ? code : undefined };
}

export type VerifyOtpResult =
  | { ok: true; customerId: string; isNew: boolean }
  | { ok: false; error: "invalid_code" | "expired" | "name_required" };

/**
 * Checks the latest unused code for `phone`. On success, finds or creates the
 * customer. A name is required only the first time a phone number signs in.
 */
export async function verifyOtp(phone: string, code: string, name: string | undefined, now = new Date()): Promise<VerifyOtpResult> {
  const [otp] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.phone, phone), isNull(otpCodes.consumedAt)))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);
  if (!otp || otp.expiresAt < now || otp.attempts >= MAX_ATTEMPTS) return { ok: false, error: "expired" };

  const expected = Buffer.from(otp.codeHash, "hex");
  const actual = Buffer.from(hashCode(phone, code), "hex");
  if (!timingSafeEqual(expected, actual)) {
    await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
    return { ok: false, error: "invalid_code" };
  }

  const [existing] = await db.select().from(customers).where(eq(customers.phone, phone));
  if (!existing && !name?.trim()) return { ok: false, error: "name_required" };

  await db.update(otpCodes).set({ consumedAt: now }).where(eq(otpCodes.id, otp.id));
  if (existing) return { ok: true, customerId: existing.id, isNew: false };

  const [created] = await db
    .insert(customers)
    .values({ phone, name: name!.trim().slice(0, 80) })
    .onConflictDoUpdate({ target: customers.phone, set: { phone } })
    .returning();
  return { ok: true, customerId: created.id, isNew: true };
}
