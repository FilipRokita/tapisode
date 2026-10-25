"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { prefersReducedMotion } from "@/components/primitives/use-reduced-motion";

interface Entry {
  readonly rect: { left: number; top: number; width: number; height: number };
  readonly ghost: HTMLElement;
}

const EASE = "cubic-bezier(0.2, 0.9, 0.25, 1)";
const idOf = (key: string) => key.split("|")[0]!;

const measure = (el: HTMLElement) => {
  const r = el.getBoundingClientRect();
  // Page coordinates, so a scroll between two renders does not look like movement.
  return { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height };
};

/**
 * Lists morph instead of snapping. Every element inside `containerRef` marked `data-flip="<id>|<shape>"` is tracked:
 * - one that stays glides from its old place to its new one,
 * - one that leaves fades out as a ghost copy,
 * - one that arrives fades in, staggered,
 * - the same id in a new shape (a card becoming "Up next" and back) morphs from the old rectangle.
 * Runs after every render. Nothing happens under reduced motion or on the first render.
 */
export function useFlipList(containerRef: RefObject<HTMLElement | null>): void {
  const previous = useRef<Map<string, Entry>>(new Map());

  useLayoutEffect(() => {
    const root = containerRef.current;
    const before = previous.current;
    const now = new Map<string, HTMLElement>();
    // A running animation moves the element, so it is set aside while the resting positions are measured, and put back
    // at the same point of its run. Without that, every later render (the server's answer, the end of a preview)
    // would cut a glide short.
    const running: { animation: Animation; time: number }[] = [];
    root?.querySelectorAll<HTMLElement>("[data-flip]").forEach((el) => {
      el.getAnimations().forEach((animation) => {
        if (animation.currentTime !== null) running.push({ animation, time: Number(animation.currentTime) });
        animation.cancel();
      });
      now.set(el.dataset.flip!, el);
    });
    const rects = new Map([...now].map(([key, el]) => [key, measure(el)]));
    running.forEach(({ animation, time }) => {
      animation.play();
      animation.currentTime = time;
    });
    // The snapshot for the next render is taken before any animation starts, so it holds resting positions.
    previous.current = new Map([...now].map(([key, el]) => [key, { rect: rects.get(key)!, ghost: el.cloneNode(true) as HTMLElement }]));

    if (prefersReducedMotion() || before.size === 0) return;
    const used = new Set<string>();
    const makeGhost = (entry: Entry): HTMLElement => {
      const g = entry.ghost;
      g.removeAttribute("data-flip");
      g.removeAttribute("id");
      g.setAttribute("aria-hidden", "true");
      g.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      g.querySelectorAll("button, a, [tabindex]").forEach((n) => n.setAttribute("tabindex", "-1"));
      g.style.cssText += `;position:absolute;left:${entry.rect.left}px;top:${entry.rect.top}px;width:${entry.rect.width}px;height:${entry.rect.height}px;margin:0;z-index:5;pointer-events:none;transform-origin:top left`;
      document.body.appendChild(g);
      return g;
    };

    let arrived = 0;
    now.forEach((el, key) => {
      const old = before.get(key);
      const rect = rects.get(key)!;
      if (old) {
        const dx = old.rect.left - rect.left;
        const dy = old.rect.top - rect.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }], { duration: 420, easing: EASE });
        return;
      }
      const altKey = [...before.keys()].find((k) => idOf(k) === idOf(key) && !now.has(k) && !used.has(k));
      if (altKey) {
        used.add(altKey);
        const o = before.get(altKey)!;
        const ghost = makeGhost(o);
        const scaleX = o.rect.width / rect.width;
        const scaleY = o.rect.height / rect.height;
        el.style.transformOrigin = "top left";
        el.animate(
          [
            { opacity: 0, transform: `translate(${o.rect.left - rect.left}px, ${o.rect.top - rect.top}px) scale(${scaleX}, ${scaleY})` },
            { opacity: 0, offset: 0.35 },
            { opacity: 1, offset: 0.75 },
            { opacity: 1, transform: "none" },
          ],
          { duration: 520, easing: EASE, fill: "backwards" },
        );
        ghost
          .animate(
            [
              { opacity: 1, transform: "none" },
              { opacity: 0, offset: 0.3 },
              { opacity: 0, transform: `translate(${rect.left - o.rect.left}px, ${rect.top - o.rect.top}px) scale(${rect.width / o.rect.width}, ${rect.height / o.rect.height})` },
            ],
            { duration: 520, easing: EASE, fill: "forwards" },
          )
          .finished.then(() => ghost.remove())
          .catch(() => ghost.remove());
      } else {
        el.animate([{ opacity: 0, transform: "translateY(12px) scale(0.97)" }, { opacity: 1, transform: "none" }], { duration: 340, delay: 140 + Math.min(arrived++, 6) * 40, easing: EASE, fill: "backwards" });
      }
    });
    before.forEach((entry, key) => {
      if (now.has(key) || used.has(key)) return;
      const ghost = makeGhost(entry);
      ghost
        .animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-8px) scale(0.96)" }], { duration: 240, easing: "ease-in", fill: "forwards" })
        .finished.then(() => ghost.remove())
        .catch(() => ghost.remove());
    });
  });
}
