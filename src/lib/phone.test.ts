import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["081 234 5678", "+66812345678"],
    ["02-123-4567", "+6621234567"],
    ["+44 7700 900123", "+447700900123"],
    ["0086 138 0013 8000", "+8613800138000"],
    ["+66 (81) 234-5678", "+66812345678"],
  ])("%s -> %s", (input, out) => expect(normalizePhone(input)).toBe(out));

  it.each(["", "12345", "abc", "+0123456789", "+66 81"])("rejects %s", (input) => expect(normalizePhone(input)).toBeNull());
});
