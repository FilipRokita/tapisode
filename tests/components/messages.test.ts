import { describe, expect, it } from "vitest";
import { changeMessage } from "@/components/library/messages";
import type { UserTitleState } from "@/domain/types";
import type { TitleView } from "@/domain/view";

const state: UserTitleState = { status: "watching", position: { season: 1, episode: 2 } };
const view = (before: UserTitleState | null) => ({ title: "Salt & Static", state: before }) as TitleView;

describe("changeMessage for a removal", () => {
  it("tells the user a tracked title was removed", () => {
    expect(changeMessage(view(state), null, { kind: "restore", state: null })).toBe("Removed from your lists");
  });
  it("says nothing when the title was on no list", () => {
    expect(changeMessage(view(null), null, { kind: "restore", state: null })).toBeNull();
  });
});
