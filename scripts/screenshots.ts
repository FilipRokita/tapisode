import { spawn } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { chromium, type Page } from "@playwright/test";

/**
 * Makes the README pictures from the running app with the fake provider: invented titles and our own artwork, never TMDB.
 *   npm run build && npm run screenshots
 * Needs the development database (migrated, with the sandbox template: `npm run db:seed`).
 */
if (existsSync(".env")) process.loadEnvFile(".env");

const PORT = 3212;
const BASE = `http://localhost:${PORT}`;
const OUT = "docs/screenshots";
mkdirSync(OUT, { recursive: true });

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("The server did not start. Run `npm run build` first.");
}

async function enter(page: Page) {
  await page.goto(`${BASE}/signin`);
  await page.getByRole("button", { name: "Try without an account" }).click();
  await page.waitForURL(/\/app\/watching/);
  await page.waitForTimeout(1500);
}

const server = spawn("npx", ["next", "start", "-p", String(PORT)], { env: { ...process.env, MEDIA_PROVIDER: "fake", BETTER_AUTH_URL: BASE }, stdio: "ignore" });
try {
  await waitForServer();
  const browser = await chromium.launch();
  const headers = (n: number) => ({ "x-forwarded-for": `10.123.${n}.${Math.floor(Math.random() * 200) + 1}` });

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, extraHTTPHeaders: headers(1) });
  const d = await desktop.newPage();
  await enter(d);
  await d.screenshot({ path: `${OUT}/desktop.png` });

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, extraHTTPHeaders: headers(2) });
  const p = await phone.newPage();
  await enter(p);
  await p.screenshot({ path: `${OUT}/phone.png` });

  // The showcase: both pictures in device frames on a dark gradient.
  const encode = async (file: string) => `data:image/png;base64,${(await (await import("node:fs/promises")).readFile(file)).toString("base64")}`;
  const [desktopImg, phoneImg] = await Promise.all([encode(`${OUT}/desktop.png`), encode(`${OUT}/phone.png`)]);
  const stage = await browser.newPage({ viewport: { width: 1600, height: 820 }, deviceScaleFactor: 2 });
  await stage.setContent(`<!doctype html><style>
    body{margin:0;width:1600px;height:820px;display:flex;align-items:center;justify-content:center;gap:72px;font-family:Inter,system-ui,sans-serif;
      background:radial-gradient(900px 500px at 30% 0%,rgba(139,92,246,.22),transparent 70%),radial-gradient(700px 500px at 90% 100%,rgba(139,92,246,.14),transparent 70%),#09090b;color:#fafafa}
    figure{margin:0;text-align:center}
    figcaption{margin-top:18px;font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#a1a1aa;font-weight:600}
    .laptop{width:940px;border-radius:18px 18px 6px 6px;border:2px solid #3f3f46;border-bottom-width:12px;background:#000;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.6)}
    .laptop img{display:block;width:100%}
    .phone{width:300px;border-radius:44px;border:10px solid #18181b;outline:2px solid #3f3f46;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.6);background:#000}
    .phone img{display:block;width:100%}
  </style>
  <figure><div class="laptop"><img src="${desktopImg}"></div><figcaption>Desktop</figcaption></figure>
  <figure><div class="phone"><img src="${phoneImg}"></div><figcaption>Phone</figcaption></figure>`);
  await stage.screenshot({ path: `${OUT}/showcase.png` });
  await browser.close();
  console.log(`Screenshots written to ${OUT}/`);
} finally {
  server.kill();
}
