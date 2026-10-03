import type { Metadata } from "next";
import { BackLink } from "@/components/site-chrome";
import { getDictionary, hasLocale } from "@/i18n/config";
import { pageI18n } from "@/i18n/server";

export async function generateMetadata({ params }: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(hasLocale(locale) ? locale : "en").privacy.title };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale, dict } = await pageI18n(params);
  const t = dict.privacy;
  return (
    <article className="space-y-5">
      <BackLink href={`/${locale}/me`} label={dict.nav.myBookings} />
      <h1 className="-mt-2 font-display text-3xl font-medium">{t.title}</h1>
      <p className="text-sm text-muted">{t.intro}</p>
      {t.sections.map((s) => (
        <section key={s.heading} className="space-y-1">
          <h2 className="font-medium">{s.heading}</h2>
          <p className="text-sm leading-relaxed text-muted">{s.body}</p>
        </section>
      ))}
    </article>
  );
}
