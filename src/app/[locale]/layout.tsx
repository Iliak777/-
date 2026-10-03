import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Cormorant_Garamond, Montserrat, Noto_Sans_Thai } from "next/font/google";
import { getDictionary, hasLocale, locales } from "@/i18n/config";
import { I18nProvider } from "@/components/i18n-provider";
import { ToastProvider } from "@/components/toast";
import "../globals.css";

const body = Montserrat({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-serif", display: "swap" });
// Not preloaded: the browser fetches it only when a page actually contains Thai text.
const thai = Noto_Sans_Thai({ subsets: ["thai"], variable: "--font-thai", display: "swap", preload: false });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(hasLocale(locale) ? locale : "en");
  return {
    title: { default: dict.common.appName, template: `%s · ${dict.common.appName}` },
    description: dict.home.heroSubtitle,
    appleWebApp: { capable: true, title: "KLINIQUE", statusBarStyle: "default" },
    icons: { icon: "/api/icon/32", apple: "/api/icon/180" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1a17" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return (
    <html lang={locale} className={`${body.variable} ${serif.variable} ${thai.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <I18nProvider locale={locale} dict={getDictionary(locale)}>
          <ToastProvider>{children}</ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
