"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { celebrate } from "@/components/confetti-host";
import { transition, type Command } from "@/domain/transitions";
import type { Status } from "@/domain/types";
import type { TitleView } from "@/domain/view";
import { useLibrary } from "./library-provider";
import { changeMessage } from "./messages";

/**
 * Runs one command on a title the way every control outside the Watching list does: the change is previewed and sent,
 * a message with Undo follows, and finishing a series fires the confetti.
 */
export function useRunCommand() {
  const library = useLibrary();
  return useCallback(
    (view: TitleView, command: Command): Promise<boolean> => {
      const result = transition(view.facts, view.state, command);
      const next = result.ok ? result.value : null;
      if (next?.status === "complete" && view.facts.type === "tv" && view.state?.status !== "complete") celebrate();
      return library.change(view, command, (undo) => {
        const message = changeMessage(view, next, command);
        if (message) toast(message, { action: { label: "Undo", onClick: () => void library.change({ ...view, state: next }, undo, () => toast("Undone")) } });
      });
    },
    [library],
  );
}

/** Moves a title to a list. */
export function useSetStatus() {
  const run = useRunCommand();
  return useCallback((view: TitleView, status: Status) => run(view, { kind: "setStatus", status }), [run]);
}
