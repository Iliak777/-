import Link from "next/link";
import { fmt, localized } from "@/i18n/config";
import { formatThb } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { allServices } from "@/server/admin-queries";

export default async function ServicesAdminPage({ params }: PageProps<"/[locale]/admin/services">) {
  const { locale, dict } = await pageI18n(params);
  const rows = await allServices();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">{dict.admin.nav.services}</h1>
        <Link href={`/${locale}/admin/services/new`} className="btn-primary py-2">+ {dict.admin.services.new}</Link>
      </div>
      <ul className="space-y-2">
        {rows.map((s) => (
          <li key={s.id}>
            <Link href={`/${locale}/admin/services/${s.id}`} className={`card flex justify-between gap-4 p-4 hover:border-gold ${s.active ? "" : "opacity-50"}`}>
              <span className="font-medium">{localized(s.name, locale)}</span>
              <span className="text-sm text-muted">
                {fmt(dict.common.minutes, { n: s.durationMin })} · {s.priceThb === null ? dict.common.priceOnConsultation : formatThb(s.priceThb, locale)}
                {!s.active && ` · ${dict.admin.services.inactive}`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
