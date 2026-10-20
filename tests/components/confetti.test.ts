import { describe, expect, it } from "vitest";
import { confettiSpread } from "@/components/confetti";

describe("confettiSpread", () => {
  it.each([
    [390, 249.6],
    [599, 383.36],
    [600, 216],
    [1440, 480],
  ])("width %i reaches %f", (width, reach) => {
    expect(confettiSpread(width)).toBeCloseTo(reach, 2);
  });
});
