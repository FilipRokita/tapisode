import { cn } from "cn";

/** The mark: a ring with a gap, a play triangle and a violet dot. Colors come from the tokens. */
export function LogoMark({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="12" className="stroke-border" strokeWidth="2.5" />
      <path d="M 4 16 A 12 12 0 1 1 16 28" className="stroke-foreground" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="28" r="2.5" className="fill-brand" />
      <polygon points="13,11 21,16 13,21" className="fill-foreground" />
    </svg>
  );
}

/** The mark and the wordmark, 8px apart. */
export function Logo({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[19px] font-bold tracking-[-0.03em]", className)}>
      <LogoMark size={size} />
      <b className="font-bold">
        Tap<span className="font-medium text-dim">isode</span>
      </b>
    </span>
  );
}
