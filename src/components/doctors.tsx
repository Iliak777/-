"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { fmt } from "@/i18n/config";
import { DOCTORS, type Doctor } from "@/lib/doctors";
import { useI18n } from "./i18n-provider";
import { Icon } from "./icons";
import { Sheet } from "./sheet";

/** Horizontal rail of surgeon portraits; a tap opens their profile in a sheet. */
export function DoctorRail({ consultHref, title }: { consultHref: string | null; title: string }) {
  const { dict } = useI18n();
  const [open, setOpen] = useState<Doctor | null>(null);

  return (
    <section id="doctors" className="scroll-mt-24 space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-gold-dark">{dict.doctors.eyebrow}</p>
          <h2 className="mt-1 font-display text-[1.6rem] leading-tight font-medium">{title}</h2>
        </div>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1">
        {DOCTORS.map((d) => (
          <li key={d.id} className="w-[9.5rem] shrink-0 snap-start">
            <button type="button" onClick={() => setOpen(d)} className="group block w-full text-left transition active:scale-[0.98]">
              <span className="relative block aspect-[3/4] overflow-hidden rounded-[1.375rem] border border-line bg-paper">
                <Image src={d.photo} alt={d.fullName} placeholder="blur" sizes="152px" className="h-full w-full object-cover object-top" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-px" style={{ background: "linear-gradient(90deg, transparent, var(--gold), transparent)" }} />
              </span>
              <span className="mt-2 block font-display text-lg leading-tight">{d.nickname}</span>
              <span className="block truncate text-xs text-muted">{dict.doctors.role}</span>
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={open !== null} onClose={() => setOpen(null)} title={dict.doctors.eyebrow}>
        {open && <DoctorProfile doctor={open} consultHref={consultHref} />}
      </Sheet>
    </section>
  );
}

function DoctorProfile({ doctor: d, consultHref }: { doctor: Doctor; consultHref: string | null }) {
  const { dict } = useI18n();
  return (
    <div className="pb-1">
      <div className="mt-2 flex items-center gap-4">
        <span className="relative isolate ml-3 shrink-0">
          <span aria-hidden className="halo -top-3 -left-3 -z-10 w-[7.5rem]" />
          <Image src={d.face} alt="" placeholder="blur" sizes="96px" className="h-24 w-24 rounded-full object-cover ring-1 ring-gold/60 ring-offset-2 ring-offset-paper" />
        </span>
        <div className="min-w-0">
          <h3 className="font-display text-[1.75rem] leading-tight font-medium">{d.nickname}</h3>
          <p className="text-sm">{d.fullName}</p>
          <p className="text-xs text-muted">{fmt(dict.doctors.license, { n: d.license })}</p>
        </div>
      </div>
      <p className="eyebrow mt-5 text-gold-dark">{dict.doctors.specialty}</p>
      <hr className="rule-gold my-3 opacity-70" />
      <ul className="space-y-2 text-sm leading-snug" lang="en">
        {d.credentials.map((c) => (
          <li key={c} className="flex gap-2.5">
            <span aria-hidden className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-gold" />
            {c}
          </li>
        ))}
      </ul>
      {consultHref && (
        <Link href={consultHref} className="btn-gold mt-6 w-full">
          <Icon name="calendar" className="h-4 w-4" />
          {dict.doctors.book}
        </Link>
      )}
    </div>
  );
}

/** Overlapping surgeon faces with a count, for the noir hero. Links to the rail. */
export function DoctorFaces() {
  const { dict } = useI18n();
  return (
    <a href="#doctors" className="mt-6 inline-flex items-center gap-3 rounded-full py-1 pr-3 transition active:opacity-70">
      <span className="flex -space-x-2.5">
        {DOCTORS.slice(0, 4).map((d) => (
          <Image key={d.id} src={d.face} alt="" sizes="36px" className="h-9 w-9 rounded-full object-cover ring-2 ring-noir" />
        ))}
      </span>
      <span className="text-xs leading-tight text-white/80">
        <span className="block text-gold">{fmt(dict.doctors.count, { n: DOCTORS.length })}</span>
        {dict.doctors.meet}
      </span>
      <Icon name="chevronRight" className="h-4 w-4 text-gold" />
    </a>
  );
}
