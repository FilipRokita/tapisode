"use client";

import { useEffect, useState } from "react";

/** The violet of the accent, used when a poster has no clear color of its own. */
export const FALLBACK_HUE = 262;

/** The average hue (0 to 359) of an image's pixels, or null when it is nearly gray. Pure, so it can be tested. */
export function averageHue(pixels: ArrayLike<number>): number | null {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if ((pixels[i + 3] ?? 0) < 128) continue;
    r += pixels[i]!;
    g += pixels[i + 1]!;
    b += pixels[i + 2]!;
    n += 1;
  }
  if (n === 0) return null;
  r /= n * 255;
  g /= n * 255;
  b /= n * 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 0.08) return null;
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  return Math.round((h * 60 + 360) % 360);
}

/**
 * The accent hue for a title: its poster drawn to a tiny canvas and averaged. Nothing derived from the image is stored.
 * Falls back to the accent when the image cannot be read.
 */
export function useAmbientHue(src: string | null | undefined): number {
  const [hue, setHue] = useState<{ src: string; hue: number } | null>(null);
  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 8;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 8, 8);
        const found = averageHue(ctx.getImageData(0, 0, 8, 8).data);
        if (!cancelled && found !== null) setHue({ src, hue: found });
      } catch {
        // A tainted canvas: keep the fallback.
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return hue && hue.src === src ? hue.hue : FALLBACK_HUE;
}
