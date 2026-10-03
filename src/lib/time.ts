/**
 * Clinic time helpers.
 *
 * The clinic runs on Asia/Bangkok time, which is UTC+7 all year (Thailand has
 * no daylight saving), so a fixed offset is exact. All instants are stored in
 * UTC; "local" values below mean Bangkok wall-clock time.
 */
export const CLINIC_TZ = "Asia/Bangkok";
const OFFSET_MS = 7 * 60 * 60 * 1000;

/** "YYYY-MM-DD" in Bangkok for the given instant. */
export function localDateString(d: Date): string {
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** Minutes since local midnight for the given instant. */
export function localMinutes(d: Date): number {
  const shifted = new Date(d.getTime() + OFFSET_MS);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/** 0 = Sunday ... 6 = Saturday, for a "YYYY-MM-DD" local date. */
export function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

/** The UTC instant for a local date plus minutes from local midnight. */
export function localToUtc(date: string, minutes: number): Date {
  return new Date(Date.parse(`${date}T00:00:00Z`) + minutes * 60_000 - OFFSET_MS);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidDateString(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

/** "HH:MM" <-> minutes, used by admin forms. */
export function minutesToHhmm(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export function hhmmToMinutes(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59 || h * 60 + min > 24 * 60) return null;
  return h * 60 + min;
}
