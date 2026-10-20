"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { prefersReducedMotion } from "@/components/primitives/use-reduced-motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Wait this long after the element comes into view, for a stagger. */
  delay?: number;
}

/**
 * Eases a block in as it scrolls into view: opacity and an 18px rise. The hidden state is added by script after load and
 * removed again 700ms later, so hover transitions are not delayed. Without script, without IntersectionObserver, or with
 * reduced motion, nothing is hidden.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !("IntersectionObserver" in window)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    el.classList.add("rv");
    el.style.setProperty("--d", `${delay}ms`);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        el.classList.add("in");
        observer.disconnect();
        timer = setTimeout(() => {
          el.classList.remove("rv", "in");
          el.style.removeProperty("--d");
        }, 700 + delay);
      },
      { threshold: 0.15, rootMargin: "0px 0px -6% 0px" },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [delay]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
