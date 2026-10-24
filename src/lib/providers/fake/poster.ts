/** Poster artwork for the fake provider: our own gradient and circles, drawn from a hue and a seed. */
export function fakePosterSvg(hue: number, seed: number): string {
  const b = (hue + 48) % 360;
  const r1 = 20 + (seed % 50);
  const r2 = 30 + (seed % 35);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 62% 38%)"/><stop offset="1" stop-color="hsl(${b} 58% 14%)"/></linearGradient>` +
    `<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset=".45" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".72"/></linearGradient></defs>` +
    `<rect width="200" height="300" fill="url(#g)"/>` +
    `<circle cx="${60 + (seed % 90)}" cy="${70 + (seed % 60)}" r="${r1 + 30}" fill="hsl(${hue} 70% 62%)" opacity=".22"/>` +
    `<circle cx="${150 - (seed % 60)}" cy="${130 + (seed % 50)}" r="${r2}" fill="hsl(${b} 80% 66%)" opacity=".18"/>` +
    `<path d="M-10 ${200 + (seed % 40)} Q 60 ${150 + (seed % 30)} 120 ${210 + (seed % 20)} T 220 ${180 + (seed % 30)} V300 H-10Z" fill="hsl(${hue} 55% 10%)" opacity=".55"/>` +
    `<rect width="200" height="300" fill="url(#s)"/></svg>`
  );
}

export const fakePosterPath = (hue: number, id: string): string => `fake:${hue}:${[...id].reduce((n, c) => n + c.charCodeAt(0), 0)}`;

export function fakePosterUrl(path: string): string {
  const [, hue = "0", seed = "0"] = path.split(":");
  return `data:image/svg+xml;utf8,${encodeURIComponent(fakePosterSvg(Number(hue), Number(seed)))}`;
}

/** Backdrop artwork for the fake provider: the same gradient and circles as the poster, laid out wide. */
export function fakeBackdropSvg(hue: number, seed: number): string {
  const b = (hue + 48) % 360;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 62% 34%)"/><stop offset="1" stop-color="hsl(${b} 58% 12%)"/></linearGradient></defs>` +
    `<rect width="320" height="180" fill="url(#g)"/>` +
    `<circle cx="${70 + (seed % 120)}" cy="${50 + (seed % 50)}" r="${60 + (seed % 30)}" fill="hsl(${hue} 70% 62%)" opacity=".2"/>` +
    `<circle cx="${250 - (seed % 90)}" cy="${90 + (seed % 40)}" r="${34 + (seed % 24)}" fill="hsl(${b} 80% 66%)" opacity=".18"/>` +
    `<path d="M-10 ${120 + (seed % 25)} Q 90 ${80 + (seed % 25)} 180 ${130 + (seed % 15)} T 330 ${110 + (seed % 20)} V180 H-10Z" fill="hsl(${hue} 55% 9%)" opacity=".6"/></svg>`
  );
}

const BACKDROP_PREFIX = "fakebd";
export const fakeBackdropPath = (hue: number, id: string): string => `${BACKDROP_PREFIX}:${hue}:${[...id].reduce((n, c) => n + c.charCodeAt(0), 0)}`;
export const isFakeBackdropPath = (path: string): boolean => path.startsWith(`${BACKDROP_PREFIX}:`);

export function fakeBackdropUrl(path: string): string {
  const [, hue = "0", seed = "0"] = path.split(":");
  return `data:image/svg+xml;utf8,${encodeURIComponent(fakeBackdropSvg(Number(hue), Number(seed)))}`;
}
