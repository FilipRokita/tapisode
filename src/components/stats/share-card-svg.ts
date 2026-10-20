import { watchingDays, type Stats } from "@/domain/stats";

export type CardFormat = "story" | "post";

/** The colors the card uses. They are read from the design tokens at runtime, so the card follows the theme. */
export interface CardPalette {
  readonly background: string;
  readonly foreground: string;
  readonly dim: string;
  readonly faint: string;
  readonly brand: string;
  readonly brandText: string;
  readonly textSoft: string;
  readonly surface: string;
  readonly border: string;
  readonly borderStrong: string;
  readonly mutedLegend: string;
  readonly light: string;
}

export const CARD_SIZE: Readonly<Record<CardFormat, { width: number; height: number }>> = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
};

/** In the story, Instagram covers the top and bottom strips, so every line of text stays between these two. */
export const STORY_SAFE = { top: 125, bottom: 1795 } as const;

const FONT = "Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/**
 * The shareable stats image as an SVG string. A pure function of the numbers, the palette, the format and the year, so the
 * preview is exactly the image that gets saved.
 */
export function buildShareCardSvg(stats: Stats, p: CardPalette, format: CardFormat, year: number): string {
  const { width: W, height: H } = CARD_SIZE[format];
  const story = format === "story";
  const total = stats.tracked;
  const counts = stats.byStatus;
  const days = watchingDays(stats.hours);

  const mark = (x: number, y: number, size: number) =>
    `<g transform="translate(${x} ${y}) scale(${size / 32})"><circle cx="16" cy="16" r="12" stroke="${p.border}" stroke-width="2.5" fill="none"/><path d="M 4 16 A 12 12 0 1 1 16 28" stroke="${p.foreground}" stroke-width="2.5" stroke-linecap="round" fill="none"/><circle cx="16" cy="28" r="2.5" fill="${p.brand}"/><polygon points="13,11 21,16 13,21" fill="${p.foreground}"/></g>`;

  const ring = (cx: number, cy: number, r: number, w: number) => {
    const circumference = 2 * Math.PI * r;
    const gap = 22;
    const order: readonly (readonly [keyof typeof counts, string])[] = [
      ["complete", p.light],
      ["watching", p.brand],
      ["watchlist", p.borderStrong],
    ];
    let walked = 0;
    let out = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.surface}" stroke-width="${w}"/>`;
    for (const [key, color] of order) {
      const n = counts[key];
      if (!n || total === 0) continue;
      const arc = (n / total) * circumference - gap;
      const dash = Math.max(0.01, arc - w);
      const angle = -90 + ((walked + gap / 2 + w / 2) / circumference) * 360;
      out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${dash} ${circumference - dash}" transform="rotate(${angle} ${cx} ${cy})"/>`;
      walked += (n / total) * circumference;
    }
    return out;
  };

  const stat = (x: number, y: number, value: number, label: string, size: number, anchor: "middle" | "start" = "middle") =>
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="800" fill="${p.foreground}" text-anchor="${anchor}" letter-spacing="${-size * 0.045}">${value}</text><text x="${x}" y="${y + Math.round(size * 0.42)}" font-size="${Math.round(size * 0.27)}" font-weight="500" fill="${p.dim}" text-anchor="${anchor}">${label}</text>`;

  const legendStep = story ? 250 : 225;
  const legend = (x: number, y: number) =>
    ([["Watching", counts.watching, p.brand], ["Watchlist", counts.watchlist, p.mutedLegend], ["Complete", counts.complete, p.light]] as const)
      .map(([label, n, color], i) => `<circle cx="${x + i * legendStep}" cy="${y - 9}" r="9" fill="${color}"/><text x="${x + i * legendStep + 24}" y="${y}" font-size="30" fill="${p.dim}" font-weight="500">${label} ${n}</text>`)
      .join("");

  const defs = `<defs>
<radialGradient id="glow" cx="${story ? "50%" : "30%"}" cy="${story ? "84%" : "100%"}" r="75%"><stop offset="0" stop-color="${p.brand}" stop-opacity=".42"/><stop offset=".55" stop-color="${p.brand}" stop-opacity=".08"/><stop offset="1" stop-color="${p.brand}" stop-opacity="0"/></radialGradient>
<radialGradient id="top" cx="22%" cy="0%" r="70%"><stop offset="0" stop-color="${p.foreground}" stop-opacity=".08"/><stop offset="1" stop-color="${p.foreground}" stop-opacity="0"/></radialGradient>
<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0"/></filter></defs>`;
  const background = `<rect width="${W}" height="${H}" fill="${p.background}"/><rect width="${W}" height="${H}" fill="url(#glow)"/><rect width="${W}" height="${H}" fill="url(#top)"/>`;
  const grain = `<rect width="${W}" height="${H}" filter="url(#n)" opacity=".07"/>`;
  const label = `${year} SO FAR`;

  let body: string;
  if (story) {
    const cx = 540;
    const cy = 700;
    body = `${[330, 445, 560, 680].map((r, i) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.foreground}" stroke-opacity="${0.07 - i * 0.012}" stroke-width="2"/>`).join("")}
<circle cx="${cx + 330 * Math.cos(-0.9)}" cy="${cy + 330 * Math.sin(-0.9)}" r="7" fill="${p.foreground}"/><circle cx="${cx + 445 * Math.cos(2.4)}" cy="${cy + 445 * Math.sin(2.4)}" r="5" fill="${p.brandText}"/><circle cx="${cx + 560 * Math.cos(0.3)}" cy="${cy + 560 * Math.sin(0.3)}" r="6" fill="${p.foreground}" fill-opacity=".7"/>
${mark(80, 132, 64)}<text x="162" y="180" font-size="44" font-weight="700" fill="${p.foreground}" letter-spacing="-1.5">Tap<tspan fill="${p.dim}" font-weight="500">isode</tspan></text>
<text x="1000" y="176" font-size="28" font-weight="600" fill="${p.faint}" text-anchor="end" letter-spacing="5">${label}</text>
${ring(cx, cy, 285, 30)}
<text x="${cx}" y="${cy + 96}" font-size="300" font-weight="800" fill="${p.foreground}" text-anchor="middle" letter-spacing="-14">${stats.episodes}</text>
<text x="${cx}" y="${cy + 168}" font-size="42" font-weight="500" fill="${p.dim}" text-anchor="middle">episodes watched</text>
<line x1="80" y1="1150" x2="1000" y2="1150" stroke="${p.foreground}" stroke-opacity=".1" stroke-width="2"/>
${stat(220, 1295, stats.hours, "hours watched", 130)}${stat(540, 1295, stats.finished, "titles finished", 130)}${stat(860, 1295, stats.tracked, "titles tracked", 130)}
<line x1="380" y1="1215" x2="380" y2="1350" stroke="${p.foreground}" stroke-opacity=".1" stroke-width="2"/><line x1="700" y1="1215" x2="700" y2="1350" stroke="${p.foreground}" stroke-opacity=".1" stroke-width="2"/>
<text x="${cx}" y="1475" font-size="46" fill="${p.textSoft}" text-anchor="middle" font-weight="500">That is about <tspan fill="${p.brandText}" font-weight="800">${days} days</tspan> of watching.</text>
${legend(205, 1590)}
<text x="540" y="1690" font-size="30" fill="${p.faint}" text-anchor="middle">${stats.series} series · ${stats.movies} movies</text>
<text x="540" y="1775" font-size="34" font-weight="600" fill="${p.foreground}" text-anchor="middle" letter-spacing="-.5">Know where you are. <tspan fill="${p.faint}" font-weight="500">One tap at a time.</tspan></text>`;
  } else {
    const cx = 330;
    const cy = 560;
    body = `${[260, 340, 420].map((r, i) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.foreground}" stroke-opacity="${0.07 - i * 0.015}" stroke-width="2"/>`).join("")}
${mark(64, 64, 56)}<text x="136" y="108" font-size="40" font-weight="700" fill="${p.foreground}" letter-spacing="-1.5">Tap<tspan fill="${p.dim}" font-weight="500">isode</tspan></text>
<text x="1016" y="104" font-size="26" font-weight="600" fill="${p.faint}" text-anchor="end" letter-spacing="5">${label}</text>
${ring(cx, cy, 205, 26)}
<text x="${cx}" y="${cy + 62}" font-size="190" font-weight="800" fill="${p.foreground}" text-anchor="middle" letter-spacing="-9">${stats.episodes}</text>
<text x="${cx}" y="${cy + 112}" font-size="30" font-weight="500" fill="${p.dim}" text-anchor="middle">episodes</text>
${stat(760, 330, stats.hours, "hours watched", 104, "start")}${stat(760, 530, stats.finished, "titles finished", 104, "start")}${stat(760, 730, stats.tracked, "titles tracked", 104, "start")}
<text x="760" y="850" font-size="30" fill="${p.textSoft}" font-weight="500">About <tspan fill="${p.brandText}" font-weight="800">${days} days</tspan></text><text x="760" y="888" font-size="30" fill="${p.textSoft}" font-weight="500">of watching</text>
${legend(64, 980)}
<text x="1016" y="980" font-size="26" fill="${p.faint}" text-anchor="end">${stats.series} series · ${stats.movies} movies</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${FONT}">${defs}${background}${body}${grain}</svg>`;
}
