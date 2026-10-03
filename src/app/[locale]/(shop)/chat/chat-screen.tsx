"use client";

import { useEffect, useState } from "react";
import { ChatWindow } from "@/components/chat-window";
import { useI18n } from "@/components/i18n-provider";

/**
 * Full-screen conversation between the header and the tab bar. It follows the
 * visual viewport, so on iPhone the input stays right above the keyboard.
 */
export function ChatScreen() {
  const { dict } = useI18n();
  const [vv, setVv] = useState<{ height: number; top: number; keyboard: boolean } | null>(null);

  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    const update = () => setVv({ height: v.height, top: v.offsetTop, keyboard: window.innerHeight - v.height > 120 });
    update();
    v.addEventListener("resize", update);
    v.addEventListener("scroll", update);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      v.removeEventListener("resize", update);
      v.removeEventListener("scroll", update);
      document.body.style.overflow = prev;
    };
  }, []);

  const top = "calc(env(safe-area-inset-top) + var(--header-h))";
  const style = vv
    ? { top: `calc(${top} + ${vv.top}px)`, height: `calc(${vv.height}px - ${top} - ${vv.keyboard ? "0.5rem" : "var(--nav-h)"})` }
    : { top, bottom: "var(--nav-h)" };

  return (
    <div className="fixed inset-x-0 z-10 mx-auto flex max-w-2xl flex-col px-4 pt-3 pb-2" style={style}>
      <h1 className="font-display text-2xl font-semibold">{dict.chat.title}</h1>
      <ChatWindow endpoint="/api/chat" me="customer" intro={dict.chat.intro} emptyText={dict.chat.empty} className="min-h-0 flex-1" />
    </div>
  );
}
