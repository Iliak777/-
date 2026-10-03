import { addDays, localToUtc, weekdayOf } from "./time";

/** Booking rules. Kept as constants until the clinic needs them editable. */
export const SLOT_STEP_MIN = 15; // slots start every 15 minutes
export const MIN_LEAD_MIN = 15; // earliest bookable slot is 15 minutes from now
export const BOOKING_HORIZON_DAYS = 30; // customers can book up to 30 days ahead

export type Interval = { start: Date; end: Date };

export type StaffSchedule = {
  staffId: number;
  hours: { weekday: number; startMin: number; endMin: number }[];
  /** Existing appointments and time off for this practitioner. */
  busy: Interval[];
};

export type Slot = { start: Date; staffIds: number[] };

function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * All bookable start times on one local date for a service of `durationMin`,
 * with the practitioners free at each time. Pure function: no I/O.
 */
export function computeSlots(opts: {
  date: string;
  durationMin: number;
  staff: StaffSchedule[];
  now: Date;
  stepMin?: number;
  leadMin?: number;
}): Slot[] {
  const { date, durationMin, staff, now } = opts;
  const step = opts.stepMin ?? SLOT_STEP_MIN;
  const earliest = new Date(now.getTime() + (opts.leadMin ?? MIN_LEAD_MIN) * 60_000);
  const weekday = weekdayOf(date);
  const byStart = new Map<number, Set<number>>();

  for (const s of staff) {
    for (const h of s.hours) {
      if (h.weekday !== weekday) continue;
      const first = Math.ceil(h.startMin / step) * step;
      for (let m = first; m + durationMin <= h.endMin; m += step) {
        const slot = { start: localToUtc(date, m), end: localToUtc(date, m + durationMin) };
        if (slot.start < earliest) continue;
        if (s.busy.some((b) => overlaps(slot, b))) continue;
        const key = slot.start.getTime();
        if (!byStart.has(key)) byStart.set(key, new Set());
        byStart.get(key)!.add(s.staffId);
      }
    }
  }

  return [...byStart.entries()]
    .sort(([a], [b]) => a - b)
    .map(([t, ids]) => ({ start: new Date(t), staffIds: [...ids].sort((a, b) => a - b) }));
}

/** The first bookable slot on or after `fromDate`, searching up to `days` days. */
export function findEarliestSlot(opts: {
  fromDate: string;
  days: number;
  durationMin: number;
  staff: StaffSchedule[];
  now: Date;
}): { date: string; slot: Slot } | null {
  for (let i = 0; i < opts.days; i++) {
    const date = addDays(opts.fromDate, i);
    const slots = computeSlots({ ...opts, date });
    if (slots.length) return { date, slot: slots[0] };
  }
  return null;
}
