import { describe, expect, it } from "vitest";
import { isCaughtUp, isFinished, nextPosition } from "@/domain/progress";
import { transition } from "@/domain/transitions";
import { demoTitles } from "@/lib/catalog/demo";

describe("the landing demo data", () => {
  it("has a series one tap from its end and a series that is caught up", async () => {
    const [salt, kingdoms] = await demoTitles();
    expect(salt?.title).toBe("Salt & Static");
    expect(kingdoms?.title).toBe("Paper Kingdoms");
    if (salt?.facts.type !== "tv" || kingdoms?.facts.type !== "tv") throw new Error("both are series");

    const finished = transition(salt.facts, salt.state, { kind: "plusOne" });
    expect(finished).toEqual({ ok: true, value: { status: "complete", position: { season: 1, episode: 8 } } });
    expect(isFinished(salt.facts, { season: 1, episode: 8 })).toBe(true);
    expect(nextPosition(salt.state!.position, salt.facts.seasons)).toEqual({ season: 1, episode: 8 });

    expect(isCaughtUp(kingdoms.facts, kingdoms.state!.position)).toBe(true);
    expect(transition(kingdoms.facts, kingdoms.state, { kind: "plusOne" })).toEqual({ ok: false, error: "CAUGHT_UP" });
  });
  it("carries poster art and services without a database", async () => {
    const [salt] = await demoTitles();
    expect(salt?.poster?.w342).toMatch(/^data:image\/svg/);
    expect(salt?.services).toEqual(["hbo"]);
  });
});
