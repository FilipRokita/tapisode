import { cn } from "cn";

/** A 5px bar. The fill's width transitions, so a change glides. */
export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn("h-[5px] overflow-hidden rounded-[3px] bg-surface-3", className)} aria-hidden="true">
      <i className="block h-full rounded-[3px] bg-brand transition-[width] duration-[600ms] ease-app" style={{ width: `${percent}%` }} />
    </div>
  );
}
