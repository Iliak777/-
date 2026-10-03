import { describe, expect, it } from "vitest";
import { computeSlots, findEarliestSlot, type StaffSchedule } from "./availability";
import { localToUtc, weekdayOf } from "./time";

const DATE = "2026-10-05"; // a Monday
const MON = weekdayOf(DATE);
const midnightBefore = new Date("2026-10-01T00:00:00Z");

function staff(id: number, startMin: number, endMin: number, busy: StaffSchedule["busy"] = []): StaffSchedule {
  return { staffId: id, hours: [{ weekday: MON, startMin, endMin }], busy };
}

describe("computeSlots", () => {
  it("returns 15-minute slots that fit the service inside working hours", () => {
    const slots = computeSlots({ date: DATE, durationMin: 60, staff: [staff(1, 600, 720)], now: midnightBefore });
    // 10:00 to 12:00, 60 min service: 10:00, 10:15, 10:30, 10:45, 11:00
    expect(slots.map((s) => s.start.toISOString())).toEqual([
      "2026-10-05T03:00:00.000Z",
      "2026-10-05T03:15:00.000Z",
      "2026-10-05T03:30:00.000Z",
      "2026-10-05T03:45:00.000Z",
      "2026-10-05T04:00:00.000Z",
    ]);
  });

  it("skips slots that overlap an existing appointment", () => {
    const busy = [{ start: localToUtc(DATE, 630), end: localToUtc(DATE, 660) }]; // 10:30-11:00
    const slots = computeSlots({ date: DATE, durationMin: 30, staff: [staff(1, 600, 720, busy)], now: midnightBefore });
    const times = slots.map((s) => s.start.getTime());
    expect(times).toContain(localToUtc(DATE, 600).getTime()); // 10:00-10:30 ok (touching)
    expect(times).not.toContain(localToUtc(DATE, 615).getTime());
    expect(times).not.toContain(localToUtc(DATE, 645).getTime());
    expect(times).toContain(localToUtc(DATE, 660).getTime()); // 11:00 ok
  });

  it("merges practitioners free at the same time", () => {
    const slots = computeSlots({
      date: DATE,
      durationMin: 30,
      staff: [staff(2, 600, 660), staff(1, 630, 700)],
      now: midnightBefore,
    });
    const at1030 = slots.find((s) => s.start.getTime() === localToUtc(DATE, 630).getTime());
    expect(at1030?.staffIds).toEqual([1, 2]);
  });

  it("respects the minimum lead time from now", () => {
    const now = localToUtc(DATE, 600); // 10:00 local
    const slots = computeSlots({ date: DATE, durationMin: 30, staff: [staff(1, 600, 720)], now });
    expect(slots[0].start.getTime()).toBe(localToUtc(DATE, 615).getTime());
  });

  it("returns nothing on a day the practitioner does not work", () => {
    const slots = computeSlots({ date: "2026-10-06", durationMin: 30, staff: [staff(1, 600, 720)], now: midnightBefore });
    expect(slots).toEqual([]);
  });

  it("aligns slots to the step even when hours start off-grid", () => {
    const slots = computeSlots({ date: DATE, durationMin: 30, staff: [staff(1, 605, 700)], now: midnightBefore });
    expect(slots[0].start.getTime()).toBe(localToUtc(DATE, 615).getTime());
  });
});

describe("findEarliestSlot", () => {
  it("rolls over to the next working day", () => {
    const res = findEarliestSlot({
      fromDate: "2026-10-04", // Sunday, no hours
      days: 7,
      durationMin: 30,
      staff: [staff(1, 600, 720)],
      now: midnightBefore,
    });
    expect(res?.date).toBe(DATE);
    expect(res?.slot.start.getTime()).toBe(localToUtc(DATE, 600).getTime());
  });

  it("returns null when nothing is free in the window", () => {
    const res = findEarliestSlot({ fromDate: "2026-10-06", days: 3, durationMin: 30, staff: [staff(1, 600, 720)], now: midnightBefore });
    expect(res).toBeNull();
  });
});
