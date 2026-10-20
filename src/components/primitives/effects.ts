import type { PointerEvent } from "react";
import { prefersReducedMotion } from "./use-reduced-motion";

const canHover = () => window.matchMedia("(hover: hover)").matches;

/** Moves the light of a `spotlight` card to the cursor. */
export function spotlightMove(event: PointerEvent<HTMLElement>): void {
  if (!canHover()) return;
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

/** Tilts an element toward the cursor. `strength` scales the angle and the growth (1 is the default). */
export function tiltMove(event: PointerEvent<HTMLElement>, target: HTMLElement | null, perspective = 800, degrees = 12, strength = 1): void {
  if (!target || !canHover() || prefersReducedMotion()) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  target.style.transform = `perspective(${perspective}px) rotateY(${x * degrees * strength}deg) rotateX(${-y * degrees * strength}deg) scale(${1 + 0.03 * strength})`;
}

export function tiltReset(target: HTMLElement | null): void {
  if (target) target.style.transform = "";
}
