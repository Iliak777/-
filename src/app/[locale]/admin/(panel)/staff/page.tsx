import Link from "next/link";
import { pageI18n } from "@/i18n/server";
import { allStaff } from "@/server/admin-queries";

export default async function StaffAdminPage({ params }: PageProps<"/[locale]/admin/staff">) {
  const { locale, dict } = await pageI18n(params);
  const rows = await allStaff();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold">{dict.admin.nav.staff}</h1>
        <Link href={`/${locale}/admin/staff/new`} className="btn-primary py-2">+ {dict.admin.staff.new}</Link>
      </div>
      <ul className="space-y-2">
        {rows.map((s) => (
          <li key={s.id}>
            <Link href={`/${locale}/admin/staff/${s.id}`} className={`card block p-4 font-medium hover:border-gold ${s.active ? "" : "opacity-50"}`}>
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
