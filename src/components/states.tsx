import Link from "next/link";
import { Icon, type IconName } from "./icons";

/** Friendly "nothing here yet" block with an optional next step. */
export function EmptyState({ icon, title, text, action }: { icon: IconName; title: string; text?: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft text-gold-dark">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="mt-4 font-medium">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>}
      {action && (
        <Link href={action.href} className="btn-primary mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

/** Inline error with a retry button, for parts of a screen that failed to load. */
export function InlineError({ text, retryLabel, onRetry }: { text: string; retryLabel: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-danger/10 px-4 py-2 text-sm text-danger">
      <span className="flex items-center gap-2 py-2">
        <Icon name="alert" className="h-4 w-4" />
        {text}
      </span>
      <button type="button" onClick={onRetry} className="btn-link shrink-0 text-danger underline-offset-4 hover:underline">
        <Icon name="refresh" className="h-4 w-4" />
        {retryLabel}
      </button>
    </div>
  );
}
