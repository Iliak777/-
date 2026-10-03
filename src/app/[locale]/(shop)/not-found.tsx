"use client";

import { useI18n } from "@/components/i18n-provider";
import { EmptyState } from "@/components/states";

export default function NotFound() {
  const { locale, dict } = useI18n();
  return <EmptyState icon="search" title={dict.common.notFound} text={dict.common.notFoundText} action={{ href: `/${locale}`, label: dict.common.toTreatments }} />;
}
