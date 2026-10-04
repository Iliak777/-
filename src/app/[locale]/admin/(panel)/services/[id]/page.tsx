import { notFound } from "next/navigation";
import { localized } from "@/i18n/config";
import { pageI18n } from "@/i18n/server";
import { saveService } from "@/server/admin-actions";
import { serviceById } from "@/server/admin-queries";
import { listCategories } from "@/server/catalog";

export default async function ServiceEditPage({ params }: PageProps<"/[locale]/admin/services/[id]">) {
  const { locale, dict } = await pageI18n(params);
  const { id } = await params;
  const isNew = id === "new";
  const svc = isNew ? undefined : await serviceById(Number(id) || 0);
  if (!isNew && !svc) notFound();
  const cats = await listCategories();
  const t = dict.admin.services;

  const field = (name: string, label: string, value: string | number | undefined, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="eyebrow text-muted">{label}</span>
      <input className="input mt-1" name={name} defaultValue={value} {...props} />
    </label>
  );

  return (
    <form action={saveService} className="max-w-xl space-y-4">
      <h1 className="font-display text-3xl font-medium">{isNew ? t.new : t.edit}</h1>
      <input type="hidden" name="locale" value={locale} />
      {svc && <input type="hidden" name="id" value={svc.id} />}
      {field("nameEn", t.nameEn, svc?.name.en, { required: true })}
      {field("nameTh", t.nameTh, svc?.name.th)}
      {field("nameZh", t.nameZh, svc?.name.zh)}
      {field("descEn", t.descEn, svc?.description.en)}
      {field("descTh", t.descTh, svc?.description.th)}
      {field("descZh", t.descZh, svc?.description.zh)}
      <label className="block">
        <span className="eyebrow text-muted">{t.category}</span>
        <select className="input mt-1" name="categoryId" defaultValue={svc?.categoryId ?? ""}>
          <option value="">{t.noCategory}</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>{localized(c.name, locale)}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        {field("durationMin", t.duration, svc?.durationMin ?? 60, { type: "number", min: 5, max: 600, step: 5, required: true })}
        {field("priceThb", t.price, svc?.priceThb ?? "", { type: "number", min: 0, step: 1 })}
      </div>
      <input type="hidden" name="sortOrder" value={svc?.sortOrder ?? 0} />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="active" defaultChecked={svc?.active ?? true} className="h-5 w-5 accent-[var(--gold)]" />
        {t.active}
      </label>
      <button className="btn-primary">{dict.common.save}</button>
    </form>
  );
}
