"use client";

import { cn } from "cn";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * A row that scrolls sideways on a phone and does not scroll at all from `md` up (the caller lays it out as a grid there).
 * The scrollbar is hidden, each edge fades only while more lies beyond it, and the mouse wheel scrolls it for a narrow
 * desktop window. Give it `overflow-x-auto` for the phone.
 */
export function ScrollRail({ className, children }: { className?: string; children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft > 1, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
    const onWheel = (e: WheelEvent) => {
      if (e.deltaX !== 0 || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    update();
    el.addEventListener("scroll", update);
    el.addEventListener("wheel", onWheel, { passive: false });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      el.removeEventListener("wheel", onWheel);
      resize.disconnect();
    };
  }, []);

  return (
    <div
      ref={rail}
      className={cn("relative [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:[mask-image:linear-gradient(to_right,var(--m0),var(--background)_32px,var(--background)_calc(100%-32px),var(--m1))]", className)}
      style={{ "--m0": edges.start ? "transparent" : "var(--background)", "--m1": edges.end ? "transparent" : "var(--background)" } as CSSProperties}
    >
      {children}
    </div>
  );
}
