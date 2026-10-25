"use client";

import { cn } from "cn";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "./icons";
import { prefersReducedMotion } from "./use-reduced-motion";

interface ScrollRailProps {
  className?: string;
  children: ReactNode;
  /** Scrolls at every width and fades its edges, instead of only on a phone. */
  always?: boolean;
  /** Round buttons at the sides, for a mouse. They show while the pointer is over the row, and a phone does not get them. */
  arrows?: boolean;
}

/**
 * A row that scrolls sideways. By default it does so on a phone only, and the caller lays it out as a grid from `md` up.
 * The scrollbar is hidden and each edge fades only while more lies beyond it. Give the row `overflow-x-auto`.
 */
export function ScrollRail({ className, children, always = false, arrows = false }: ScrollRailProps) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft > 1, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
    update();
    el.addEventListener("scroll", update);
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, []);

  const page = (direction: 1 | -1) => rail.current?.scrollBy({ left: direction * rail.current.clientWidth * 0.85, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  // Written out in full, because Tailwind finds class names by reading the source.
  const mask = always
    ? "[mask-image:linear-gradient(to_right,var(--m0),var(--background)_32px,var(--background)_calc(100%-32px),var(--m1))]"
    : "max-md:[mask-image:linear-gradient(to_right,var(--m0),var(--background)_32px,var(--background)_calc(100%-32px),var(--m1))]";

  return (
    <div className="group/rail relative">
      <div
        ref={rail}
        className={cn("relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", mask, className)}
        style={{ "--m0": edges.start ? "transparent" : "var(--background)", "--m1": edges.end ? "transparent" : "var(--background)" } as CSSProperties}
      >
        {children}
      </div>
      {arrows && (
        <>
          <Arrow side="left" shown={edges.start} onClick={() => page(-1)} />
          <Arrow side="right" shown={edges.end} onClick={() => page(1)} />
        </>
      )}
    </div>
  );
}

function Arrow({ side, shown, onClick }: { side: "left" | "right"; shown: boolean; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Scroll left" : "Scroll right"}
      onClick={onClick}
      tabIndex={shown ? 0 : -1}
      className={cn(
        "absolute top-[38%] z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-[14px] border border-border-strong bg-background/80 text-foreground backdrop-blur-md transition-[opacity,transform,background-color] duration-200 ease-app hover:bg-surface-2 active:scale-95 md:grid",
        side === "left" ? "-left-3" : "-right-3",
        shown ? "opacity-0 group-focus-within/rail:opacity-100 group-hover/rail:opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
