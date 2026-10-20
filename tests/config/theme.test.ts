import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { THEME_COLOR } from "@/config/theme";

describe("theme", () => {
  it("matches the background token", () => {
    const css = readFileSync("src/styles/tokens.css", "utf8");
    expect(css).toMatch(new RegExp(`--background:\\s*${THEME_COLOR};`));
  });
});
