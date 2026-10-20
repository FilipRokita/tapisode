"use client";

import { cn } from "cn";

interface SegmentedProps<T extends string> {
  items: readonly { readonly value: T; readonly label: string }[];
  /** Null shows no pill, for a title that is on no list yet. */
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  /** "tab" for switching views, "button" for a toggle group. */
  kind?: "tab" | "button";
}

/** A track with a pill that slides to the chosen item. The pill is positioned by CSS variables so it can transition. */
export function Segmented<T extends string>({ items, value, onChange, label, className, kind = "button" }: SegmentedProps<T>) {
  const index = value === null ? 0 : Math.max(0, items.findIndex((i) => i.value === value));
  return (
    <div
      role={kind === "tab" ? "tablist" : "group"}
      aria-label={label}
      className={cn("relative flex gap-0.5 rounded-[14px] border border-border bg-surface-2 p-[3px]", className)}
      style={{ "--n": items.length, "--i": index } as React.CSSProperties}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[3px] bottom-[3px] left-[3px] w-[calc((100%-6px)/var(--n))] rounded-[11px] bg-surface-3 transition-[transform,opacity] duration-[340ms] ease-app",
          value === null && "opacity-0",
        )}
        style={{ transform: "translateX(calc(var(--i) * 100%))" }}
      />
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role={kind === "tab" ? "tab" : undefined}
            aria-selected={kind === "tab" ? active : undefined}
            aria-pressed={kind === "button" ? active : undefined}
            onClick={() => onChange(item.value)}
            className={cn("relative z-10 min-h-[38px] flex-1 rounded-[11px] text-sm font-semibold transition-colors duration-[250ms]", active ? "text-foreground" : "text-dim hover:text-foreground")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
