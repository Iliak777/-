"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "./i18n-provider";
import { formatDateTime } from "@/i18n/format";

type Message = { id: number; sender: "customer" | "staff"; body: string; createdAt: string };

const POLL_MS = 3000;

/**
 * Conversation view shared by the customer chat and the clinic inbox.
 * New messages arrive by polling `endpoint?after=<lastId>` every few seconds
 * while the tab is visible (see README: why polling for the MVP).
 */
export function ChatWindow({ endpoint, me, emptyText, className = "" }: { endpoint: string; me: "customer" | "staff"; emptyText?: string; className?: string }) {
  const { locale, dict } = useI18n();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const lastId = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);

  const append = useCallback((incoming: Message[]) => {
    const fresh = incoming.filter((m) => m.id > lastId.current);
    if (!fresh.length) return;
    lastId.current = fresh[fresh.length - 1].id;
    setMessages((prev) => [...prev, ...fresh]);
  }, []);

  const poll = useCallback(async () => {
    const res = await fetch(`${endpoint}?after=${lastId.current}`, { cache: "no-store" });
    if (res.ok) append((await res.json()).messages);
  }, [endpoint, append]);

  useEffect(() => {
    poll();
    const timer = setInterval(() => document.visibilityState === "visible" && poll(), POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  useEffect(() => bottom.current?.scrollIntoView({ block: "end" }), [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setSending(true);
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
    setSending(false);
    if (res.ok) {
      setDraft("");
      await poll();
    }
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex-1 space-y-2 overflow-y-auto py-2">
        {messages.length === 0 && emptyText && <p className="py-8 text-center text-sm text-muted">{emptyText}</p>}
        {messages.map((m) => {
          const mine = m.sender === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "rounded-br-sm bg-ink text-paper" : "rounded-bl-sm border border-line bg-paper"}`}>
                {!mine && m.sender === "staff" && <p className="eyebrow mb-1 text-gold-dark">{dict.chat.clinic}</p>}
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-[0.65rem] ${mine ? "text-paper/60" : "text-muted"}`}>{formatDateTime(new Date(m.createdAt), locale)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t border-line pt-3">
        <input className="input flex-1" placeholder={dict.chat.placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} />
        <button className="btn-primary px-5" disabled={sending || !draft.trim()}>
          {dict.chat.send}
        </button>
      </form>
    </div>
  );
}
