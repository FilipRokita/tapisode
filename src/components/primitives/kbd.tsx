import { cn } from "cn";

/** A keyboard key hint such as ⌘K. */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <kbd className={cn("mono rounded-[6px] border border-border-strong bg-surface-2 px-1.5 py-0.5 text-[11px] text-dim", className)}>{children}</kbd>;
}
