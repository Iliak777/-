import en from "./messages/en.json";
import th from "./messages/th.json";
import zh from "./messages/zh.json";

export const locales = ["th", "en", "zh"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, th, zh };

export const localeNames: Record<Locale, string> = { th: "ไทย", en: "English", zh: "中文" };

/** BCP 47 tags for date and number formatting. */
export const intlLocale: Record<Locale, string> = { th: "th-TH", en: "en-GB", zh: "zh-CN" };

export function hasLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Replaces {name} placeholders. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** Picks the best available translation of database text. */
export function localized(text: { en: string; th?: string; zh?: string }, locale: Locale): string {
  return text[locale]?.trim() || text.en;
}
