"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useOffline } from "next/offline";
import { localeNames, locales, type Locale } from "@/i18n/config";
import { useI18n } from "./i18n-provider";
import { Icon, type IconName } from "./icons";
import { Logo } from "./logo";

/**
 * A small globe button that opens the phone's native picker. The real <select>
 * sits invisibly on top at 16px, so iOS does not zoom the page when it opens.
 */
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
    <label className="relative flex h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink transition active:bg-cream">
      <Icon name="globe" className="h-[1.1rem] w-[1.1rem] text-gold-dark" />
      {locale.toUpperCase()}
      <select
        aria-label={dict.common.language}
        value={locale}
        onChange={(e) => change(e.target.value as Locale)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
        style={{ fontSize: 16 }}
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Header() {
  const { locale } = useI18n();
  return (
    <header className="sticky top-0 z-30 border-b border-line/60 bg-cream/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-[var(--header-h)] max-w-2xl items-center justify-between pr-2 pl-4">
        <Link href={`/${locale}`} aria-label="THE KLINIQUE" className="flex h-11 items-center">
          <Logo />
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}

/** "‹ Back" with a full 44pt touch area, for screens below a tab. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="-ml-2 inline-flex min-h-11 items-center gap-0.5 pr-3 pl-1 text-sm text-muted transition active:opacity-60">
      <Icon name="chevronLeft" className="h-5 w-5" />
      {label}
    </Link>
  );
}

/** Floating tab bar: a black pill with the active tab in gold, thumb-reachable on phones. */
export function BottomNav() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const tabs: { href: string; label: string; icon: IconName; active: boolean }[] = [
    { href: `/${locale}`, label: dict.nav.treatments, icon: "sparkle", active: pathname === `/${locale}` || pathname.startsWith(`/${locale}/book/`) },
    { href: `/${locale}/chat`, label: dict.nav.chat, icon: "chat", active: pathname.startsWith(`/${locale}/chat`) },
    {
      href: `/${locale}/me`,
      label: dict.nav.myBookings,
      icon: "calendar",
      active: pathname.startsWith(`/${locale}/me`) || pathname.startsWith(`/${locale}/booking`) || pathname.startsWith(`/${locale}/privacy`),
    },
  ];
  return (
    <nav aria-label={dict.nav.label} className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
      <div className="pointer-events-auto mx-auto grid h-15 max-w-md grid-cols-3 rounded-full border border-white/10 bg-noir/92 px-1.5 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.55)] backdrop-blur-xl">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[0.66rem] font-medium tracking-wide transition active:scale-95 ${t.active ? "text-gold" : "text-white/55"}`}
          >
            <Icon name={t.icon} className="h-[1.35rem] w-[1.35rem]" strokeWidth={t.active ? 1.9 : 1.5} />
            {t.label}
            {t.active && <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-gold" />}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Shown while the phone has no connection; Next.js retries navigations by itself once it is back. */
export function OfflineBanner() {
  const { dict } = useI18n();
  const offline = useOffline();
  if (!offline) return null;
  return (
    <div role="status" className="animate-pop fixed inset-x-0 top-[calc(env(safe-area-inset-top)+var(--header-h)+0.5rem)] z-40 flex justify-center px-4">
      <p className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper shadow-lg">
        <Icon name="offline" className="h-4 w-4 text-gold" />
        {dict.common.offline}
      </p>
    </div>
  );
}
