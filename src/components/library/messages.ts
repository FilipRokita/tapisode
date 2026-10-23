import { episodeCode, STATUS_LABEL } from "@/components/copy";
import { isStarted } from "@/domain/progress";
import type { Command } from "@/domain/transitions";
import type { UserTitleState } from "@/domain/types";
import type { TitleView } from "@/domain/view";

/** What to tell the user after a change went through. Null when the change needs no message. */
export function changeMessage(view: TitleView, next: UserTitleState | null, command: Command): string | null {
  const before = view.state;
  if (next === null) return command.kind === "restore" && before !== null ? "Removed from your lists" : null;
  const code = episodeCode(next.position.season, next.position.episode);
  if (command.kind === "plusOne") {
    if (before === null || before.status !== "watching") return `Moved to Watching: ${code}`;
    if (next.status === "complete") return `${view.title} finished. Moved to Complete.`;
    if (isStarted(before.position) && next.position.season !== before.position.season) return `Season ${next.position.season} started: ${code}`;
    return `Marked ${code}`;
  }
  if (command.kind === "setStatus") {
    const reset = view.facts.type === "tv" && next.status === "watchlist" && before !== null && isStarted(before.position);
    return reset ? "Moved to Watchlist. Progress reset." : `Moved to ${STATUS_LABEL[next.status]}`;
  }
  return null;
}
