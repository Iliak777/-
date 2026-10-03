import Link from "next/link";
import { connection } from "next/server";
import { localized } from "@/i18n/config";
import { pageI18n } from "@/i18n/server";
import { listActiveServices, listCategories } from "@/server/catalog";
import { ServiceList } from "./service-list";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  await connection();
  const { locale, dict } = await pageI18n(params);
  const [cats, svcs] = await Promise.all([listCategories(), listActiveServices()]);

  const items = svcs.map((s) => ({
    id: s.id,
    categoryId: s.categoryId,
    name: localized(s.name, locale),
    description: localized(s.description, locale),
    durationMin: s.durationMin,
    priceThb: s.priceThb,
  }));
  const usedCats = cats
    .filter((c) => items.some((i) => i.categoryId === c.id))
    .map((c) => ({ id: c.id, name: localized(c.name, locale) }));

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-ink px-6 py-8 text-paper">
        <p className="eyebrow text-gold">{dict.common.tagline}</p>
        <h1 className="mt-3 font-display text-3xl leading-tight font-semibold">{dict.home.heroTitle}</h1>
        <p className="mt-2 text-sm text-paper/75">{dict.home.heroSubtitle}</p>
        <Link href={`/${locale}/chat`} className="mt-5 inline-flex items-center gap-2 text-sm text-gold underline-offset-4 hover:underline">
          {dict.home.chatCta} →
        </Link>
      </section>
      <ServiceList categories={usedCats} services={items} />
    </div>
  );
}
