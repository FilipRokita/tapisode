import { cn } from "cn";

const CIRCUMFERENCE = 100.5;

/** A ring with the percent in the middle (38px for lists, 64px for the drawer). */
export function ProgressRing({ percent, size = 38, className }: { percent: number; size?: 38 | 64; className?: string }) {
  const big = size === 64;
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }} role="img" aria-label={`${percent}% watched`}>
      <svg viewBox="0 0 38 38" className="size-full -rotate-90">
        <circle cx="19" cy="19" r="16" fill="none" className="stroke-border" strokeWidth={big ? 3 : 3.5} />
        <circle
          cx="19"
          cy="19"
          r="16"
          fill="none"
          className="stroke-brand transition-[stroke-dashoffset] duration-[600ms] ease-app"
          strokeWidth={big ? 3 : 3.5}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
        />
      </svg>
      <em className={cn("absolute inset-0 grid place-items-center not-italic mono", big ? "text-sm text-foreground" : "text-[10px] text-dim")}>{percent}%</em>
    </div>
  );
}
