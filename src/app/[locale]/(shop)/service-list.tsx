"use client";

import Link from "next/link";
import { useState } from "react";
import { fmt } from "@/i18n/config";
import { formatThb } from "@/i18n/format";
import { useI18n } from "@/components/i18n-provider";

type Item = { id: number; categoryId: number | null; name: string; description: string; durationMin: number; priceThb: number | null };

export function ServiceList({ categories, services }: { categories: { id: number; name: string }[]; services: Item[] }) {
  const { locale, dict } = useI18n();
  const [cat, setCat] = useState<number | null>(null);
  const shown = cat === null ? services : services.filter((s) => s.categoryId === cat);

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm transition ${active ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink"}`;

  return (
    <section>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        <button className={chip(cat === null)} onClick={() => setCat(null)}>
          {dict.home.all}
        </button>
        {categories.map((c) => (
          <button key={c.id} className={chip(cat === c.id)} onClick={() => setCat(c.id)}>
            {c.name}
          </button>
        ))}
      </div>
      <ul className="mt-3 space-y-3">
        {shown.map((s) => (
          <li key={s.id}>
            <Link href={`/${locale}/book/${s.id}`} className="card flex items-center gap-4 p-4 transition hover:border-gold active:scale-[0.99]">
              <div className="min-w-0 flex-1">
                <h2 className="font-medium">{s.name}</h2>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted">{s.description}</p>
                <p className="mt-2 text-xs text-gold-dark">
                  {fmt(dict.common.minutes, { n: s.durationMin })} ·{" "}
                  {s.priceThb === null ? dict.common.priceOnConsultation : formatThb(s.priceThb, locale)}
                </p>
              </div>
              <span aria-hidden className="text-xl text-gold">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
