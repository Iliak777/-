import { BottomNav, Header, OfflineBanner } from "@/components/site-chrome";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <OfflineBanner />
      <main className="mx-auto max-w-2xl px-4 pt-4 pb-[calc(var(--nav-h)+2rem)]">{children}</main>
      <BottomNav />
    </>
  );
}
