import Link from "next/link";
import { z } from "zod";
import { formatDateTime } from "@/i18n/format";
import { pageI18n } from "@/i18n/server";
import { ChatWindow } from "@/components/chat-window";
import { listThreads } from "@/server/chat";

export default async function InboxPage({ params, searchParams }: PageProps<"/[locale]/admin/inbox">) {
  const { locale, dict } = await pageI18n(params);
  const c = (await searchParams).c;
  const selected = typeof c === "string" && z.uuid().safeParse(c).success ? c : null;
  const threads = await listThreads();
  const current = threads.find((t) => t.customerId === selected);

  return (
    <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
      <ul className="space-y-2">
        {threads.length === 0 && <p className="text-muted">{dict.admin.inbox.none}</p>}
        {threads.map((t) => (
          <li key={t.customerId}>
            <Link
              href={`/${locale}/admin/inbox?c=${t.customerId}`}
              className={`card block p-3 text-sm ${t.customerId === selected ? "border-gold" : ""}`}
            >
              <div className="flex justify-between gap-2">
                <span className="font-medium">{t.customerName}</span>
                {t.unread && <span className="rounded-full bg-gold px-2 text-xs text-paper">{dict.admin.inbox.unread}</span>}
              </div>
              <p className="text-muted">{t.phone}</p>
              <p className="text-xs text-muted">{formatDateTime(t.lastMessageAt, locale)}</p>
            </Link>
          </li>
        ))}
      </ul>
      <section className="card p-4">
        {current ? (
          <>
            <p className="font-medium">
              {current.customerName} · <a className="text-muted" href={`tel:${current.phone}`}>{current.phone}</a>
            </p>
            <ChatWindow key={current.customerId} endpoint={`/api/admin/chat/${current.customerId}`} me="staff" className="h-[60vh]" />
          </>
        ) : (
          <p className="text-muted">{dict.admin.inbox.select}</p>
        )}
      </section>
    </div>
  );
}
