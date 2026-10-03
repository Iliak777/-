"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Icon } from "./icons";

type Toast = { id: number; text: string; tone: "success" | "error" };
type Show = (text: string, tone?: Toast["tone"]) => void;

const ToastContext = createContext<Show>(() => {});

/** Short confirmation messages after an action ("Booking cancelled"). Lives in the root layout so it survives navigation. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const show = useCallback<Show>((text, tone = "success") => {
    const id = ++nextId.current;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="animate-pop flex max-w-md items-center gap-2.5 rounded-full bg-ink px-4 py-2.5 text-sm text-paper shadow-lg">
            <Icon name={t.tone === "success" ? "check" : "alert"} className={`h-4 w-4 ${t.tone === "success" ? "text-gold" : "text-danger"}`} strokeWidth={2} />
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
