"use client";

import { launchConfetti } from "./confetti";

const CANVAS_ID = "confetti-canvas";

/** A full-screen canvas the confetti draws on. Mounted once by the shell. */
export function ConfettiHost() {
  return <canvas id={CANVAS_ID} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[130] size-full" />;
}

/** Fires the confetti burst. Does nothing when the canvas is not mounted or motion is reduced. */
export function celebrate(): void {
  const canvas = document.getElementById(CANVAS_ID);
  if (canvas instanceof HTMLCanvasElement) launchConfetti(canvas);
}
