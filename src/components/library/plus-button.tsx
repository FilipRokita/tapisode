"use client";

import { cn } from "cn";
import { useState } from "react";

interface PlusButtonProps {
  /** The main words: `+1 Episode`, `Caught up`, `Mark as watched`. */
  label: string;
  /** The quiet part after it: `→ S02E05`. */
  target?: string | null;
  /** The white button of "Up next" or the violet-soft one of a card. */
  tone: "white" | "soft";
  caught?: boolean;
  onPress?: () => void;
  className?: string;
}

/** The one-tap button. A press scales it and a violet pulse fades out over it. */
export function PlusButton({ label, target, tone, caught = false, onPress, className }: PlusButtonProps) {
  const [presses, setPresses] = useState(0);
  const press = () => {
    if (caught) return;
    setPresses((n) => n + 1);
    if ("vibrate" in navigator) navigator.vibrate(12);
    onPress?.();
  };
  return (
    <button
      type="button"
      onClick={press}
      aria-disabled={caught || undefined}
      tabIndex={caught ? -1 : undefined}
      data-pressed={presses > 0 ? presses : undefined}
      className={cn(
        "needs-net relative z-10 mt-auto flex min-h-11 select-none items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-[14px] text-[15px] font-bold transition-[transform,background-color] duration-[140ms] ease-app active:scale-[.96]",
        tone === "white" && "min-h-[46px] bg-foreground text-on-light hover:bg-light",
        tone === "soft" && "min-h-11 border border-brand-line bg-brand-soft text-sm text-brand-text hover:bg-brand-soft-strong",
        caught && (tone === "soft" ? "border-border bg-transparent text-faint hover:bg-transparent" : "border border-border bg-surface-2 text-dim hover:bg-surface-2"),
        caught && "pointer-events-none",
        className,
      )}
    >
      <span key={presses} aria-hidden="true" className={cn("pointer-events-none absolute inset-0 rounded-[inherit] bg-brand opacity-0", presses > 0 && "animate-[pulse-press_0.5s_var(--ease)]")} />
      {label}
      {target && <span className={cn("mono max-[340px]:hidden text-xs font-medium", tone === "white" ? "text-on-light-faint" : "text-faint", caught && "font-sans text-[13px]")}>{target}</span>}
    </button>
  );
}
