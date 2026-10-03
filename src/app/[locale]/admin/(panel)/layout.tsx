import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Logo } from "@/components/logo";
import { pageI18n } from "@/i18n/server";
import { currentAdminId } from "@/lib/session";
import { adminLogout } from "@/server/admin-actions";
import { unreadThreadCount } from "@/server/chat";

export default async function AdminLayout({ children, params }: LayoutProps<"/[locale]/admin">) {
  await connection();
  const { locale, dict } = await pageI18n(params);
  if (!(await currentAdminId())) redirect(`/${locale}/admin/login`);
  const unread = await unreadThreadCount();
  const t = dict.admin.nav;
  const links = [
    { href: `/${locale}/admin`, label: t.appointments },
    { href: `/${locale}/admin/inbox`, label: t.inbox, badge: unread },
    { href: `/${locale}/admin/services`, label: t.services },
    { href: `/${locale}/admin/staff`, label: t.staff },
  ];
  return (
    <div className="min-h-full">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Logo />
          <nav className="flex flex-1 flex-wrap gap-4 text-sm">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-gold-dark">
                {l.label}
                {!!l.badge && <span className="ml-1 rounded-full bg-gold px-1.5 text-xs text-paper">{l.badge}</span>}
              </Link>
            ))}
          </nav>
          <form action={adminLogout}>
            <input type="hidden" name="locale" value={locale} />
            <button className="text-sm text-muted hover:underline">{dict.admin.signOut}</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
