import "server-only";
import { randomInt } from "node:crypto";
import { and, asc, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { db } from "@/db";
import { appointments, services, staff, staffServices, timeOff, workingHours } from "@/db/schema";
import {
  BOOKING_HORIZON_DAYS,
  computeSlots,
  findEarliestSlot,
  type Interval,
  type Slot,
  type StaffSchedule,
} from "@/lib/availability";
import { addDays, localDateString, localToUtc } from "@/lib/time";

export async function getActiveService(serviceId: number) {
  const [svc] = await db
    .select()
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.active, true)));
  return svc ?? null;
}

/** Active practitioners who perform the service. */
export async function staffForService(serviceId: number) {
  return db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .innerJoin(staffServices, eq(staffServices.staffId, staff.id))
    .where(and(eq(staffServices.serviceId, serviceId), eq(staff.active, true)))
    .orderBy(asc(staff.name));
}

/** Schedules (hours + busy intervals) for the given practitioners within [from, to). */
async function loadSchedules(staffIds: number[], from: Date, to: Date): Promise<StaffSchedule[]> {
  if (staffIds.length === 0) return [];
  const [hours, appts, off] = await Promise.all([
    db.select().from(workingHours).where(inArray(workingHours.staffId, staffIds)),
    db
      .select({ staffId: appointments.staffId, start: appointments.startsAt, end: appointments.endsAt })
      .from(appointments)
      .where(
        and(
          inArray(appointments.staffId, staffIds),
          ne(appointments.status, "cancelled"),
          lt(appointments.startsAt, to),
          gt(appointments.endsAt, from),
        ),
      ),
    db
      .select({ staffId: timeOff.staffId, start: timeOff.startsAt, end: timeOff.endsAt })
      .from(timeOff)
      .where(and(inArray(timeOff.staffId, staffIds), lt(timeOff.startsAt, to), gt(timeOff.endsAt, from))),
  ]);
  return staffIds.map((id) => ({
    staffId: id,
    hours: hours.filter((h) => h.staffId === id),
    busy: [...appts, ...off].filter((b) => b.staffId === id).map((b): Interval => ({ start: b.start, end: b.end })),
  }));
}

function clampToHorizon(date: string, now: Date): boolean {
  const today = localDateString(now);
  return date >= today && date <= addDays(today, BOOKING_HORIZON_DAYS);
}

/** Bookable slots for one local date. `staffId` narrows to one practitioner. */
export async function getDaySlots(serviceId: number, date: string, staffId: number | null, now = new Date()): Promise<Slot[]> {
  const svc = await getActiveService(serviceId);
  if (!svc || !clampToHorizon(date, now)) return [];
  const ids = (await staffForService(serviceId)).map((s) => s.id).filter((id) => staffId === null || id === staffId);
  const schedules = await loadSchedules(ids, localToUtc(date, 0), localToUtc(date, 24 * 60));
  return computeSlots({ date, durationMin: svc.durationMin, staff: schedules, now });
}

/** The soonest bookable slot from now on. */
export async function getEarliestSlot(serviceId: number, staffId: number | null, now = new Date()) {
  const svc = await getActiveService(serviceId);
  if (!svc) return null;
  const ids = (await staffForService(serviceId)).map((s) => s.id).filter((id) => staffId === null || id === staffId);
  const fromDate = localDateString(now);
  const schedules = await loadSchedules(ids, localToUtc(fromDate, 0), localToUtc(addDays(fromDate, BOOKING_HORIZON_DAYS + 1), 0));
  return findEarliestSlot({ fromDate, days: BOOKING_HORIZON_DAYS + 1, durationMin: svc.durationMin, staff: schedules, now });
}

const REF_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

function newRef(): string {
  return Array.from({ length: 6 }, () => REF_ALPHABET[randomInt(REF_ALPHABET.length)]).join("");
}

function isPgError(e: unknown, code: string): boolean {
  // drizzle wraps driver errors; the Postgres code may sit on the error or its cause
  const err = e as { code?: string; cause?: { code?: string } };
  return err?.code === code || err?.cause?.code === code;
}

export type CreateBookingResult =
  | { ok: true; id: string; ref: string }
  | { ok: false; error: "service_unavailable" | "slot_taken" };

/**
 * Books a slot. With `staffId` null ("any practitioner") it tries every free
 * practitioner in turn. The database exclusion constraint is the final guard
 * against two people booking the same practitioner at once.
 */
export async function createBooking(input: {
  customerId: string;
  serviceId: number;
  staffId: number | null;
  startsAt: Date;
  locale: string;
  now?: Date;
}): Promise<CreateBookingResult> {
  const now = input.now ?? new Date();
  const svc = await getActiveService(input.serviceId);
  if (!svc) return { ok: false, error: "service_unavailable" };

  const date = localDateString(input.startsAt);
  const slot = (await getDaySlots(svc.id, date, input.staffId, now)).find(
    (s) => s.start.getTime() === input.startsAt.getTime(),
  );
  if (!slot) return { ok: false, error: "slot_taken" };

  const endsAt = new Date(input.startsAt.getTime() + svc.durationMin * 60_000);
  for (const staffId of slot.staffIds) {
    for (let refTry = 0; refTry < 3; refTry++) {
      try {
        const [row] = await db
          .insert(appointments)
          .values({
            ref: newRef(),
            customerId: input.customerId,
            serviceId: svc.id,
            staffId,
            startsAt: input.startsAt,
            endsAt,
            priceThb: svc.priceThb,
            locale: input.locale,
          })
          .returning({ id: appointments.id, ref: appointments.ref });
        return { ok: true, ...row };
      } catch (e) {
        if (isPgError(e, "23P01")) break; // practitioner just got booked; try the next one
        if (isPgError(e, "23505")) continue; // booking ref collision; draw a new one
        throw e;
      }
    }
  }
  return { ok: false, error: "slot_taken" };
}

/** A customer's bookings, newest first, with service and practitioner names. */
export async function listCustomerBookings(customerId: string) {
  return db
    .select({
      id: appointments.id,
      ref: appointments.ref,
      startsAt: appointments.startsAt,
      endsAt: appointments.endsAt,
      status: appointments.status,
      priceThb: appointments.priceThb,
      serviceName: services.name,
      staffName: staff.name,
    })
    .from(appointments)
    .innerJoin(services, eq(services.id, appointments.serviceId))
    .innerJoin(staff, eq(staff.id, appointments.staffId))
    .where(eq(appointments.customerId, customerId))
    .orderBy(asc(appointments.startsAt));
}

export async function getCustomerBooking(customerId: string, id: string) {
  const rows = await listCustomerBookings(customerId);
  return rows.find((r) => r.id === id) ?? null;
}

/** Customers can cancel their own confirmed bookings that have not started yet. */
export async function cancelCustomerBooking(customerId: string, id: string, now = new Date()): Promise<boolean> {
  const res = await db
    .update(appointments)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.customerId, customerId),
        eq(appointments.status, "confirmed"),
        gt(appointments.startsAt, now),
      ),
    )
    .returning({ id: appointments.id });
  return res.length > 0;
}
