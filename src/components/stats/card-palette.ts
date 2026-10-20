import type { CardPalette } from "./share-card-svg";

const token = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** The share card's colors, read from the design tokens on the page. */
export function readCardPalette(): CardPalette {
  return {
    background: token("--background"),
    foreground: token("--foreground"),
    dim: token("--dim"),
    faint: token("--faint"),
    brand: token("--brand"),
    brandText: token("--brand-text"),
    textSoft: token("--text-soft"),
    surface: token("--surface"),
    border: token("--border"),
    borderStrong: token("--border-strong"),
    mutedLegend: token("--on-light-faint"),
    light: token("--light-hover"),
  };
}
