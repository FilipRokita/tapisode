import { prefersReducedMotion } from "./primitives/use-reduced-motion";

const PIECES = 92;
const DURATION = 3600;
const FADE = 1000;
const GRAVITY = 520;
const LAMBDA = -Math.log(0.45);

/** How far sideways the fan reaches: nearly edge to edge on a phone, a contained fan on a wide screen. */
export const confettiSpread = (width: number): number => (width < 600 ? width * 0.64 : Math.min(width * 0.36, 480));

/** Reads a color token from the page, so the confetti follows the theme. */
const token = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/**
 * Draws a burst of confetti on the canvas, sized to its box, from the bottom center. Time based, so it looks the same at any frame rate.
 * Returns a function that stops it. Does nothing when the visitor prefers reduced motion.
 */
export function launchConfetti(canvas: HTMLCanvasElement): () => void {
  if (prefersReducedMotion()) return () => {};
  if ("vibrate" in navigator) navigator.vibrate([20, 40, 20]);
  const width = (canvas.width = canvas.clientWidth);
  const height = (canvas.height = canvas.clientHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const colors = ["--brand", "--brand-text", "--foreground", "--light-hover", "--faint"].map(token);
  const reach = confettiSpread(width);
  const pieces = Array.from({ length: PIECES }, () => {
    const u = Math.random() * 2 - 1;
    return {
      x: width / 2 + (Math.random() - 0.5) * 20,
      y: height + 14,
      vx: u * reach * LAMBDA,
      vy: -(620 + Math.random() * 320) * (1 - Math.abs(u) * 0.18),
      size: 5 + Math.random() * 6,
      angle: Math.random() * 6.28,
      spin: (Math.random() - 0.5) * 5,
      phase: Math.random() * 6.28,
      color: colors[Math.floor(Math.random() * colors.length)]!,
    };
  });
  const start = performance.now();
  let last = start;
  let frame = 0;
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const elapsed = now - start;
    ctx.clearRect(0, 0, width, height);
    for (const p of pieces) {
      p.vy += GRAVITY * dt;
      p.vx *= Math.pow(0.45, dt);
      p.vy *= Math.pow(0.8, dt);
      p.x += p.vx * dt + Math.sin(elapsed / 320 + p.phase) * 18 * dt;
      p.y += p.vy * dt;
      p.angle += p.spin * dt;
      if (p.x < 10) {
        p.x = 10;
        p.vx = Math.abs(p.vx) * 0.4;
      } else if (p.x > width - 10) {
        p.x = width - 10;
        p.vx = -Math.abs(p.vx) * 0.4;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.scale(1, Math.cos(elapsed / 240 + p.phase));
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, (DURATION - elapsed) / FADE));
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
      ctx.restore();
    }
    if (elapsed < DURATION) frame = requestAnimationFrame(tick);
    else ctx.clearRect(0, 0, width, height);
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    ctx.clearRect(0, 0, width, height);
  };
}
