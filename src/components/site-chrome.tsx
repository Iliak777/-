"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { useI18n } from "./i18n-provider";
import { Logo } from "./logo";

function LanguageSwitcher() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  function change(next: Locale) {
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    const parts = pathname.split("/");
    parts[1] = next;
    router.replace(parts.join("/") || `/${next}`);
  }
  return (
    <select
      aria-label={dict.common.language}
      value={locale}
      onChange={(e) => change(e.target.value as Locale)}
      className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs"
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}

export function Header() {
  const { locale } = useI18n();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href={`/${locale}`} aria-label="THE KLINIQUE">
          <Logo />
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

const icons = {
  treatments: "M12 3l2.5 5.5L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.5-.8z",
  chat: "M4 5h16v11H8l-4 4z",
  me: "M7 3h10v18l-5-3-5 3z",
};

/** App-style tab bar, thumb-reachable on phones. */
export function BottomNav() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const tabs = [
    { href: `/${locale}`, label: dict.nav.treatments, icon: icons.treatments, active: pathname === `/${locale}` || pathname.startsWith(`/${locale}/book`) },
    { href: `/${locale}/chat`, label: dict.nav.chat, icon: icons.chat, active: pathname.startsWith(`/${locale}/chat`) },
    { href: `/${locale}/me`, label: dict.nav.myBookings, icon: icons.me, active: pathname.startsWith(`/${locale}/me`) || pathname.startsWith(`/${locale}/booking`) },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-2xl grid-cols-3">
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} className={`flex flex-col items-center gap-1 py-2.5 text-[0.7rem] ${t.active ? "text-gold-dark" : "text-muted"}`}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
