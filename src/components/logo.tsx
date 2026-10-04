/** Wordmark in the website's style until the clinic's logo file is added. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-start leading-none ${className}`}>
      <span className="mb-1 text-[0.5rem] font-medium tracking-[0.6em] text-gold-dark">THE</span>
      <span className="font-display text-[1.3rem] font-medium tracking-[0.2em]">KLINIQUE</span>
    </span>
  );
}
