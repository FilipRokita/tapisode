import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/** Fails when a raw color appears in the UI outside the token file. Colors belong in src/styles/tokens.css. */
const ROOTS = ["src/app", "src/components", "src/styles"];
const ALLOWED = new Set([path.normalize("src/styles/tokens.css")]);
const COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/g;

function* files(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* files(full);
    else if (/\.(tsx?|css)$/.test(name)) yield full;
  }
}

let bad = 0;
for (const root of ROOTS) {
  let entries: Generator<string>;
  try {
    statSync(root);
    entries = files(root);
  } catch {
    continue;
  }
  for (const file of entries) {
    if (ALLOWED.has(path.normalize(file))) continue;
    readFileSync(file, "utf8").split("\n").forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, "");
      for (const match of code.match(COLOR) ?? []) {
        console.error(`${file}:${i + 1}: raw color ${match} (use a token)`);
        bad += 1;
      }
    });
  }
}
if (bad > 0) process.exit(1);
console.log("No raw colors outside the token file.");
