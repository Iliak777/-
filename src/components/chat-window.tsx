"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n-provider";
import { Icon } from "./icons";
import { formatDate, formatTime } from "@/i18n/format";
import { api } from "@/lib/api";
import { addDays, localDateString } from "@/lib/time";

type Message = { id: number; sender: "customer" | "staff"; body: string; createdAt: string };
/** A message typed here that the server has not confirmed yet. */
type Outgoing = { key: number; body: string; failed: boolean };

const POLL_MS = 3000;

/**
 * Conversation view shared by the customer chat and the clinic inbox.
 * New messages arrive by polling `endpoint?after=<lastId>` every few seconds
 * while the tab is visible (see README: why polling for the MVP).
 * Sent messages show at once and are marked if sending fails, with a retry.
 */
export function ChatWindow({
  endpoint,
  me,
  intro,
  emptyText,
  className = "",
}: {
  endpoint: string;
  me: "customer" | "staff";
  intro?: string;
  emptyText?: string;
  className?: string;
}) {
  const { locale, dict } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [outgoing, setOutgoing] = useState<Outgoing[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState("");
  const lastId = useRef(0);
  const nextKey = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);

  const append = useCallback((incoming: Message[]) => {
    const fresh = incoming.filter((m) => m.id > lastId.current);
    if (!fresh.length) return;
    lastId.current = fresh[fresh.length - 1].id;
    setMessages((prev) => [...prev, ...fresh]);
  }, []);

  const poll = useCallback(async () => {
    const res = await api<{ messages: Message[] }>(`${endpoint}?after=${lastId.current}`);
    if (res.ok) append(res.data.messages);
    setLoaded(true);
  }, [endpoint, append]);

  useEffect(() => {
    const first = setTimeout(poll, 0);
    const timer = setInterval(() => document.visibilityState === "visible" && poll(), POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [poll]);

  useEffect(() => bottom.current?.scrollIntoView({ block: "end" }), [messages.length, outgoing.length]);

  async function deliver(item: Outgoing) {
    const res = await api(endpoint, { body: { body: item.body } });
    if (!res.ok) return setOutgoing((all) => all.map((o) => (o.key === item.key ? { ...o, failed: true } : o)));
    await poll();
    setOutgoing((all) => all.filter((o) => o.key !== item.key));
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    const item = { key: ++nextKey.current, body, failed: false };
    setDraft("");
    setOutgoing((all) => [...all, item]);
    deliver(item);
  }

  function retry(item: Outgoing) {
    const again = { ...item, failed: false };
    setOutgoing((all) => all.map((o) => (o.key === item.key ? again : o)));
    deliver(again);
  }

  const today = localDateString(new Date());
  const dayLabel = (day: string, at: Date) => (day === today ? dict.common.today : day === addDays(today, -1) ? dict.chat.yesterday : formatDate(at, locale));

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain py-3" aria-live="polite">
        {intro && <p className="mx-auto mb-3 max-w-sm rounded-2xl bg-gold-soft px-4 py-3 text-center text-xs text-gold-dark">{intro}</p>}
        {!loaded ? (
          <div className="space-y-2 pt-2" aria-busy="true">
            <div className="skeleton h-10 w-2/3" />
            <div className="skeleton ml-auto h-10 w-1/2" />
          </div>
        ) : (
          messages.length === 0 && outgoing.length === 0 && emptyText && <p className="py-8 text-center text-sm text-muted">{emptyText}</p>
        )}
        {messages.map((m, i) => {
          const at = new Date(m.createdAt);
          const day = localDateString(at);
          const newDay = i === 0 || localDateString(new Date(messages[i - 1].createdAt)) !== day;
          return (
            <div key={m.id}>
              {newDay && <p className="py-2 text-center text-[0.7rem] font-medium text-muted">{dayLabel(day, at)}</p>}
              <Bubble mine={m.sender === me} label={m.sender === "staff" && me === "customer" ? dict.chat.clinic : undefined} time={formatTime(at, locale)}>
                {m.body}
              </Bubble>
            </div>
          );
        })}
        {outgoing.map((o) => (
          <Bubble key={o.key} mine time={o.failed ? undefined : dict.chat.sending} pending>
            {o.body}
            {o.failed && (
              <button type="button" onClick={() => retry(o)} className="mt-1 flex items-center gap-1 text-[0.7rem] font-medium text-danger">
                <Icon name="alert" className="h-3.5 w-3.5" />
                {dict.chat.failed}
              </button>
            )}
          </Bubble>
        ))}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex items-center gap-2 border-t border-line pt-3">
        <input
          className="input flex-1 rounded-full py-2.5"
          placeholder={dict.chat.placeholder}
          aria-label={dict.chat.placeholder}
          enterKeyHint="send"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
        />
        <button className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition active:scale-95 disabled:opacity-40" disabled={!draft.trim()} aria-label={dict.chat.send}>
          <Icon name="send" className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}

function Bubble({ mine, label, time, pending = false, children }: { mine: boolean; label?: string; time?: string; pending?: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-[1.25rem] px-4 py-2 text-[0.95rem] ${mine ? "rounded-br-md bg-ink text-paper" : "rounded-bl-md border border-line bg-paper"} ${pending ? "opacity-70" : ""}`}
      >
        {label && <p className="eyebrow mb-0.5 text-gold-dark">{label}</p>}
        <div className="break-words whitespace-pre-wrap">{children}</div>
        {time && <p className={`mt-0.5 text-right text-[0.65rem] ${mine ? "text-paper/60" : "text-muted"}`}>{time}</p>}
      </div>
    </div>
  );
}
