import type { CSSProperties } from "react";

/** The entrance of the `k`-th section of a page: it rises in after the one before it, as the sections of the title drawer do. */
export const stagger = (k: number) => ({
  className: "animate-[section-in_0.55s_var(--ease)_backwards] [animation-delay:calc(var(--k)*55ms+60ms)]",
  style: { "--k": k } as CSSProperties,
});

/** The small uppercase heading of a section of Home. */
export const SECTION_HEADING = "text-[13px] font-semibold tracking-[0.08em] text-faint uppercase";
