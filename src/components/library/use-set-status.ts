"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { Command } from "@/domain/transitions";
import type { TitleView } from "@/domain/view";
import { useLibrary } from "./library-provider";
import { changeMessage } from "./messages";
import { transition } from "@/domain/transitions";

/** Moves a title to a list by hand (a movie's "Mark as watched") and offers Undo. */
export function useSetStatus() {
  const library = useLibrary();
  return useCallback(
    (view: TitleView, status: "watching" | "watchlist" | "complete") => {
      const command: Command = { kind: "setStatus", status };
      const result = transition(view.facts, view.state, command);
      void library.change(view, command, (undo) => {
        const message = result.ok ? changeMessage(view, result.value, command) : null;
        if (message && result.ok) toast(message, { action: { label: "Undo", onClick: () => void library.change({ ...view, state: result.value }, undo, () => toast("Undone")) } });
      });
    },
    [library],
  );
}

export function useMarkWatched() {
  const setStatus = useSetStatus();
  return useCallback((view: TitleView) => setStatus(view, "complete"), [setStatus]);
}
