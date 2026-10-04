import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Bodoni_Moda, Jost, Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import { getDictionary, hasLocale, locales } from "@/i18n/config";
import { I18nProvider } from "@/components/i18n-provider";
import { ToastProvider } from "@/components/toast";
import "../globals.css";

// Jost: geometric, Futura-like body face. Bodoni Moda: high-contrast fashion-house serif for headlines.
const body = Jost({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const serif = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
// Not preloaded: the browser fetches these only when a page actually contains Thai text.
const thai = Noto_Sans_Thai({ subsets: ["thai"], variable: "--font-thai", display: "swap", preload: false });
const thaiSerif = Noto_Serif_Thai({ subsets: ["thai"], variable: "--font-thai-serif", display: "swap", preload: false });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(hasLocale(locale) ? locale : "en");
  return {
    title: { default: dict.common.appName, template: `%s · ${dict.common.appName}` },
    description: dict.home.heroSubtitle,
    appleWebApp: { capable: true, title: "THE KLINIQUE", statusBarStyle: "default" },
    icons: { icon: "/api/icon/32", apple: "/api/icon/180" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffdfa" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1714" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return (
    <html lang={locale} className={`${body.variable} ${serif.variable} ${thai.variable} ${thaiSerif.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <I18nProvider locale={locale} dict={getDictionary(locale)}>
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
