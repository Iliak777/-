import { describe, expect, it } from "vitest";
import { icsEvent } from "./ics";

describe("icsEvent", () => {
  it("writes UTC times and escapes text", () => {
    const ics = icsEvent({
      uid: "abc@klinique",
      start: new Date("2026-11-02T03:00:00Z"),
      end: new Date("2026-11-02T04:30:00Z"),
      title: "Ulthera; face, neck",
      location: "Siam Square Soi 7, Bangkok",
      description: "Ref ABC123",
      now: new Date("2026-10-01T00:00:00Z"),
    });
    expect(ics).toContain("DTSTART:20261102T030000Z\r\n");
    expect(ics).toContain("DTEND:20261102T043000Z\r\n");
    expect(ics).toContain(String.raw`SUMMARY:Ulthera\; face\, neck` + "\r\n");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
  });
});
