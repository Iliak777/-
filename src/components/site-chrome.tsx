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
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/90 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
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

/** App-style tab bar, thumb-reachable on phones. */
export function BottomNav() {
  const { locale, dict } = useI18n();
  const pathname = usePathname();
  const tabs: { href: string; label: string; icon: IconName; active: boolean }[] = [
    { href: `/${locale}`, label: dict.nav.treatments, icon: "sparkle", active: pathname === `/${locale}` || pathname.startsWith(`/${locale}/book`) },
    { href: `/${locale}/chat`, label: dict.nav.chat, icon: "chat", active: pathname.startsWith(`/${locale}/chat`) },
    {
      href: `/${locale}/me`,
      label: dict.nav.myBookings,
      icon: "calendar",
      active: pathname.startsWith(`/${locale}/me`) || pathname.startsWith(`/${locale}/booking`) || pathname.startsWith(`/${locale}/privacy`),
    },
  ];
  return (
    <nav aria-label={dict.nav.label} className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-paper/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto grid h-14 max-w-2xl grid-cols-3">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            aria-current={t.active ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 text-[0.68rem] font-medium transition active:scale-95 ${t.active ? "text-gold-dark" : "text-muted"}`}
          >
            <Icon name={t.icon} className="h-6 w-6" strokeWidth={t.active ? 2 : 1.6} />
            {t.label}
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
