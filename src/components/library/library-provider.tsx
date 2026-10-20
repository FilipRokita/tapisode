"use client";

import { createContext, startTransition, useCallback, useContext, useMemo, useOptimistic, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { changeTitle } from "@/actions/library";
import { sortByActivity } from "@/domain/lists";
import { transition, type Command } from "@/domain/transitions";
import type { UserTitleState } from "@/domain/types";
import type { TitleView } from "@/domain/view";
import { errorMessage, OFFLINE_MESSAGE } from "../copy";

interface Change {
  readonly view: TitleView;
  /** Null removes the title from the lists. */
  readonly state: UserTitleState | null;
}

interface Library {
  /** The user's titles, newest activity first, already showing a change that is still on its way to the server. */
  readonly titles: readonly TitleView[];
  /** Titles whose content is missing right now (purged and not fetched again yet). They are not in `titles`. */
  readonly pending: number;
  /**
   * Applies a command: previews it at once, sends it, and rolls the preview back if the server refuses.
   * Resolves with true when the server applied it, false when it was refused or never sent.
   */
  readonly change: (view: TitleView, command: Command, onDone?: (undo: Command) => void) => Promise<boolean>;
}

const LibraryContext = createContext<Library | null>(null);

export const useLibrary = (): Library => {
  const library = useContext(LibraryContext);
  if (!library) throw new Error("useLibrary must be used inside LibraryProvider");
  return library;
};

/** Puts the changed title into the list, or replaces it. The same function serves the preview and the confirmed result. */
const withChange = (titles: readonly TitleView[], { view, state }: Change, activityAt: number): TitleView[] => {
  if (state === null) return titles.filter((t) => t.id !== view.id);
  const next: TitleView = { ...view, state, activityAt };
  return sortByActivity([...titles.filter((t) => t.id !== view.id), next]);
};

export function LibraryProvider({ initial, pending = 0, children }: { initial: readonly TitleView[]; pending?: number; children: ReactNode }) {
  const [confirmed, setConfirmed] = useState(initial);
  // The preview is dropped automatically when the transition ends, which is the rollback.
  const [titles, preview] = useOptimistic(confirmed, (list, change: Change) => withChange(list, change, Date.now()));

  const change = useCallback<Library["change"]>((view, command, onDone) => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      toast(OFFLINE_MESSAGE);
      return Promise.resolve(false);
    }
    const result = transition(view.facts, view.state, command);
    if (!result.ok) {
      toast(errorMessage(result.error));
      return Promise.resolve(false);
    }
    const wanted = result.value;
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        preview({ view, state: wanted });
        try {
          const response = await changeTitle({ ref: view.ref, expected: view.state, command });
          if (response.ok) {
            setConfirmed((list) => withChange(list, { view, state: response.state }, response.activityAt));
            onDone?.({ kind: "restore", state: view.state });
          } else {
            toast(errorMessage(response.error));
            if (response.error === "CONFLICT" && response.current !== undefined) {
              const current = response.current;
              setConfirmed((list) => withChange(list, { view, state: current }, Date.now()));
            }
          }
          resolve(response.ok);
        } catch (error) {
          resolve(false);
          throw error;
        }
      });
    });
  }, [preview]);

  const value = useMemo<Library>(() => ({ titles, pending, change }), [titles, pending, change]);
  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
