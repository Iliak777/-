"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { fmt } from "@/i18n/config";
import { formatThb } from "@/i18n/format";
import { useI18n } from "@/components/i18n-provider";
import { Icon } from "@/components/icons";
import { EmptyState } from "@/components/states";

type Item = { id: number; categoryId: number | null; name: string; keywords: string; description: string; durationMin: number; priceThb: number | null };
type Category = { id: number; name: string };

export function ServiceList({ categories, services }: { categories: Category[]; services: Item[] }) {
  const { dict } = useI18n();
  const [cat, setCat] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const q = useDeferredValue(query.trim().toLowerCase());

  const shown = services.filter((s) => (cat === null || s.categoryId === cat) && (!q || s.keywords.includes(q)));
  // With "All" and no search, the menu reads like the clinic's: grouped under category headings.
  const groups =
    cat === null && !q
      ? [...categories.map((c) => ({ id: c.id, name: c.name, items: shown.filter((s) => s.categoryId === c.id) })), { id: 0, name: "", items: shown.filter((s) => s.categoryId === null) }].filter((g) => g.items.length)
      : [{ id: -1, name: "", items: shown }];

  return (
    <section>
      <div className="sticky top-[calc(env(safe-area-inset-top)+var(--header-h))] z-20 -mx-4 space-y-3 bg-cream/95 px-4 pt-1 pb-3 backdrop-blur-xl">
        <label className="relative block">
          <span className="sr-only">{dict.home.search}</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-muted" />
          <input
            type="search"
            enterKeyHint="search"
            className="input rounded-full py-2.5 pr-11 pl-11"
            placeholder={dict.home.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label={dict.common.clear} className="absolute top-1/2 right-1 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-muted">
              <Icon name="close" className="h-4 w-4" />
            </button>
          )}
        </label>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label={dict.home.categories}>
          <button className="chip" aria-pressed={cat === null} onClick={() => setCat(null)}>
            {dict.home.all}
          </button>
          {categories.map((c) => (
            <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon="search" title={dict.home.noResults} text={dict.home.noResultsHint} />
      ) : (
        <div className="mt-1 space-y-6">
          {groups.map((g) => (
            <div key={g.id}>
              {g.name && <h2 className="eyebrow mb-2.5 text-muted">{g.name}</h2>}
              <ul className="space-y-2.5">
                {g.items.map((s) => (
                  <li key={s.id}>
                    <ServiceCard s={s} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ServiceCard({ s }: { s: Item }) {
  const { locale, dict } = useI18n();
  return (
    <Link href={`/${locale}/book/${s.id}`} className="card flex items-center gap-3 p-4 transition hover:border-gold active:scale-[0.99] active:bg-cream">
      <div className="min-w-0 flex-1">
        <h3 className="font-medium">{s.name}</h3>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted">{s.description}</p>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gold-dark">
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" className="h-3.5 w-3.5" />
            {fmt(dict.common.minutes, { n: s.durationMin })}
          </span>
          <span>{s.priceThb === null ? dict.common.priceOnConsultation : formatThb(s.priceThb, locale)}</span>
        </p>
      </div>
      <Icon name="chevronRight" className="h-5 w-5 text-gold" />
    </Link>
  );
}
