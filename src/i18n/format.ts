import { CLINIC_TZ } from "@/lib/time";
import { intlLocale, type Locale } from "./config";

export function formatTime(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { timeZone: CLINIC_TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}

export function formatDate(d: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale[locale], { timeZone: CLINIC_TZ, weekday: "short", day: "numeric", month: "short" }).format(d);
}

export function formatDateTime(d: Date, locale: Locale): string {
  return `${formatDate(d, locale)}, ${formatTime(d, locale)}`;
}

export function formatThb(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(intlLocale[locale], { style: "currency", currency: "THB", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 }).format(amount);
}
