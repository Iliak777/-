/** Wordmark in the website's style until the clinic's logo file is added. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-start leading-none ${className}`}>
      <span className="text-[0.55rem] tracking-[0.5em] text-gold">THE</span>
      <span className="font-display text-xl font-semibold tracking-[0.22em]">KLINIQUE</span>
    </span>
  );
}
