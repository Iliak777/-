/**
 * Runs against a real Postgres (TEST_DATABASE_URL, default: local klinique_test),
 * so the double-booking constraint is exercised for real.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, pgClient } from "@/db";
import { customers, services, staff, staffServices, workingHours } from "@/db/schema";
import { localToUtc, weekdayOf } from "@/lib/time";
import { cancelCustomerBooking, createBooking, getDaySlots, getEarliestSlot } from "./booking";
import { requestOtp, verifyOtp } from "./otp";

const DATE = "2026-11-02"; // Monday
const NOW = new Date("2026-11-01T00:00:00Z");
let serviceId: number;
let staffA: number;
let staffB: number;
let customerId: string;

beforeEach(async () => {
  await db.execute(sql`truncate appointments, otp_codes, chat_messages, chat_threads, customers, working_hours, time_off, staff_services, staff, services, categories restart identity cascade`);
  [{ id: serviceId }] = await db.insert(services).values({ name: { en: "Facial" }, durationMin: 60, priceThb: 1500 }).returning();
  [{ id: staffA }, { id: staffB }] = await db.insert(staff).values([{ name: "A" }, { name: "B" }]).returning();
  await db.insert(staffServices).values([{ staffId: staffA, serviceId }, { staffId: staffB, serviceId }]);
  // Both work 10:00 to 12:00 on Mondays.
  await db.insert(workingHours).values([staffA, staffB].map((id) => ({ staffId: id, weekday: weekdayOf(DATE), startMin: 600, endMin: 720 })));
  [{ id: customerId }] = await db.insert(customers).values({ phone: "+66810000000", name: "Test" }).returning();
});

afterAll(async () => {
  await pgClient.end();
});

const at = (min: number) => localToUtc(DATE, min);

describe("booking", () => {
  it("books 'any practitioner' and fills both practitioners before the slot disappears", async () => {
    const first = await createBooking({ customerId, serviceId, staffId: null, startsAt: at(600), locale: "en", now: NOW });
    expect(first.ok).toBe(true);
    let slot = (await getDaySlots(serviceId, DATE, null, NOW)).find((s) => s.start.getTime() === at(600).getTime());
    expect(slot?.staffIds).toEqual([staffB]);

    const second = await createBooking({ customerId, serviceId, staffId: null, startsAt: at(600), locale: "en", now: NOW });
    expect(second.ok).toBe(true);
    slot = (await getDaySlots(serviceId, DATE, null, NOW)).find((s) => s.start.getTime() === at(600).getTime());
    expect(slot).toBeUndefined();

    const third = await createBooking({ customerId, serviceId, staffId: null, startsAt: at(600), locale: "en", now: NOW });
    expect(third).toEqual({ ok: false, error: "slot_taken" });
  });

  it("lets only one of two simultaneous bookings for the same practitioner win", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => createBooking({ customerId, serviceId, staffId: staffA, startsAt: at(630), locale: "en", now: NOW })),
    );
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    const [{ count }] = await db.execute<{ count: number }>(sql`select count(*)::int as count from appointments where staff_id = ${staffA}`);
    expect(count).toBe(1);
  });

  it("rejects times that are not real slots", async () => {
    const res = await createBooking({ customerId, serviceId, staffId: staffA, startsAt: at(605), locale: "en", now: NOW });
    expect(res).toEqual({ ok: false, error: "slot_taken" });
  });

  it("frees the slot again after cancellation", async () => {
    const res = await createBooking({ customerId, serviceId, staffId: staffA, startsAt: at(600), locale: "en", now: NOW });
    if (!res.ok) throw new Error("booking failed");
    expect((await getDaySlots(serviceId, DATE, staffA, NOW)).map((s) => s.start.getTime())).not.toContain(at(600).getTime());
    expect(await cancelCustomerBooking(customerId, res.id, NOW)).toBe(true);
    expect((await getDaySlots(serviceId, DATE, staffA, NOW)).map((s) => s.start.getTime())).toContain(at(600).getTime());
  });

  it("finds the earliest slot on the next working day", async () => {
    const earliest = await getEarliestSlot(serviceId, null, NOW); // NOW is a Sunday
    expect(earliest?.date).toBe(DATE);
    expect(earliest?.slot.start.getTime()).toBe(at(600).getTime());
  });
});

describe("otp", () => {
  it("signs in an existing customer and asks a new one for a name", async () => {
    process.env.OTP_DEV_ECHO = "true";
    const req = await requestOtp("+66810000000");
    if (!req.ok || !req.devCode) throw new Error("no code");
    const wrong = req.devCode === "000000" ? "111111" : "000000";
    expect(await verifyOtp("+66810000000", wrong, undefined)).toEqual({ ok: false, error: "invalid_code" });
    expect(await verifyOtp("+66810000000", req.devCode, undefined)).toMatchObject({ ok: true, customerId, isNew: false });
    // A code works only once.
    expect((await verifyOtp("+66810000000", req.devCode, undefined)).ok).toBe(false);

    const req2 = await requestOtp("+66899999999");
    if (!req2.ok || !req2.devCode) throw new Error("no code");
    expect(await verifyOtp("+66899999999", req2.devCode, undefined)).toEqual({ ok: false, error: "name_required" });
    expect(await verifyOtp("+66899999999", req2.devCode, "Nok")).toMatchObject({ ok: true, isNew: true });
  });

  it("rate-limits code requests per phone", async () => {
    for (let i = 0; i < 3; i++) expect((await requestOtp("+66811111111")).ok).toBe(true);
    expect(await requestOtp("+66811111111")).toEqual({ ok: false, error: "rate_limited" });
  });

  it("locks a code after too many wrong guesses", async () => {
    process.env.OTP_DEV_ECHO = "true";
    const req = await requestOtp("+66822222222");
    if (!req.ok || !req.devCode) throw new Error("no code");
    const wrong = req.devCode === "000000" ? "111111" : "000000";
    for (let i = 0; i < 5; i++) await verifyOtp("+66822222222", wrong, "X");
    expect(await verifyOtp("+66822222222", req.devCode, "X")).toEqual({ ok: false, error: "expired" });
  });
});
