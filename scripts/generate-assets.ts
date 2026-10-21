import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

/**
 * Builds the static brand assets from the design tokens: the favicon, the PWA and Apple icons and the social preview image.
 * Changing the accent is one edit in src/styles/tokens.css and one run of `npm run assets`.
 */
const css = readFileSync("src/styles/tokens.css", "utf8");
const token = (name: string): string => {
  const match = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  if (!match?.[1]) throw new Error(`Token --${name} not found`);
  return match[1].trim();
};
const c = { bg: token("background"), track: token("border"), fg: token("foreground"), dim: token("dim"), brand: token("brand") };

/** The mark on a 32 unit grid. `pad` leaves room around it, for icons that a platform crops to a shape. */
const mark = (pad: number) =>
  `<g transform="translate(${pad} ${pad}) scale(${(32 - 2 * pad) / 32})"><circle cx="16" cy="16" r="12" stroke="${c.track}" stroke-width="2.5"/>` +
  `<path d="M 4 16 A 12 12 0 1 1 16 28" stroke="${c.fg}" stroke-width="2.5" stroke-linecap="round"/><circle cx="16" cy="28" r="2.5" fill="${c.brand}"/>` +
  `<polygon points="13,11 21,16 13,21" fill="${c.fg}"/></g>`;

const iconSvg = (size: number, pad: number) => `<svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="${c.bg}"/>${mark(pad)}</svg>`;

writeFileSync("src/app/icon.svg", `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">${mark(0)}</svg>\n`);

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, pad] of [["icon-192", 192, 0], ["icon-512", 512, 0], ["icon-maskable-512", 512, 4], ["apple-touch-icon", 180, 2]] as const) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0">${iconSvg(size, pad)}</body>`);
  await page.screenshot({ path: `public/${file}.png` });
}

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<body style="margin:0;width:1200px;height:630px;background:${c.bg};display:grid;place-items:center;font-family:Inter,system-ui,sans-serif">
  <div style="text-align:center"><svg width="120" height="120" viewBox="0 0 32 32" fill="none">${mark(0)}</svg>
  <div style="margin-top:28px;font-size:84px;font-weight:700;letter-spacing:-0.03em;color:${c.fg}">Tap<span style="color:${c.dim};font-weight:500">isode</span></div>
  <div style="margin-top:14px;font-size:34px;color:${c.dim}">Know where you are. One tap at a time.</div></div></body>`);
await page.screenshot({ path: "src/app/opengraph-image.png" });
await browser.close();

// The offline page is one static file with its own styles, because nothing else can load when it is shown.
writeFileSync(
  "public/offline.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="${c.bg}"><title>Offline - Tapisode</title>
<style>*{box-sizing:border-box;margin:0}body{min-height:100vh;display:grid;place-items:center;text-align:center;padding:24px;background:${c.bg};color:${c.fg};font-family:Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
h1{font-size:28px;letter-spacing:-.04em;font-weight:800;margin:20px 0 8px}p{color:${c.dim};max-width:32ch;margin:0 auto 22px}
button{min-height:52px;padding:0 24px;border:0;border-radius:16px;background:${c.fg};color:${c.bg};font:700 16px/1 inherit;cursor:pointer}</style></head>
<body><main><svg width="76" height="76" viewBox="0 0 32 32" fill="none" aria-hidden="true">${mark(0)}</svg><h1>You're offline</h1>
<p>Tapisode needs a connection to load your lists.</p><button onclick="location.reload()">Try again</button></main></body></html>\n`,
);
console.log("Assets written.");
