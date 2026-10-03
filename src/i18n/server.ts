import "server-only";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "./config";

/** Resolves the [locale] route param and its dictionary, or 404s. */
export async function pageI18n(params: Promise<{ locale: string }>) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return { locale, dict: getDictionary(locale) };
}
