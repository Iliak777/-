import { describe, expect, it } from "vitest";
import en from "./messages/en.json";
import th from "./messages/th.json";
import zh from "./messages/zh.json";

function keys(obj: unknown, prefix = ""): string[] {
  if (Array.isArray(obj)) return [`${prefix}[${obj.length}]`];
  if (obj && typeof obj === "object")
    return Object.entries(obj).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
  return [prefix];
}

describe("translations", () => {
  it.each([["th", th], ["zh", zh]])("%s has exactly the same keys as en", (_, dict) => {
    expect(keys(dict).sort()).toEqual(keys(en).sort());
  });
});
