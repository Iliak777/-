"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "./i18n-provider";
import { Icon } from "./icons";

/**
 * iOS-style bottom sheet for confirmations. Closes on the backdrop, the close
 * button or Escape (unless `locked` while an action runs), locks page scroll
 * and moves focus into the sheet for screen readers and keyboards.
 */
export function Sheet({ open, onClose, title, locked = false, children }: { open: boolean; onClose: () => void; title: string; locked?: boolean; children: React.ReactNode }) {
  const { dict } = useI18n();
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Kept in refs so an inline onClose does not re-run the effect (and steal focus) on every render.
  const close = useRef(onClose);
  const isLocked = useRef(locked);
  useEffect(() => {
    close.current = onClose;
    isLocked.current = locked;
  });

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const opener = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !isLocked.current && close.current();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  // Portalled to <body> so no parent's stacking context or transform can trap it under the header.
  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="animate-fade absolute inset-0 bg-black/45" onClick={() => !locked && onClose()} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="animate-sheet relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[1.75rem] bg-paper px-5 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl outline-none"
      >
        <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-line" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <p id={titleId} className="eyebrow pt-3 text-gold-dark">{title}</p>
          <button type="button" onClick={onClose} disabled={locked} className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-muted transition active:bg-cream disabled:opacity-40" aria-label={dict.common.close}>
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
