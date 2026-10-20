"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { celebrate } from "@/components/confetti-host";
import { errorMessage, OFFLINE_MESSAGE } from "@/components/copy";
import { transition, type Command } from "@/domain/transitions";
import type { UserTitleState } from "@/domain/types";
import type { TitleView } from "@/domain/view";
import { useLibrary } from "./library-provider";
import { changeMessage } from "./messages";

const PLUS_ONE: Command = { kind: "plusOne" };

/**
 * The `+1` flow for the Watching page. The card first shows the result by itself (the number rolls, the bar fills), and
 * only then does the list change: 300ms before a card is promoted to "Up next", 450ms before a finished title leaves.
 * `previews` holds the state a card shows while it waits.
 */
export function usePlusOne() {
  const library = useLibrary();
  const [previews, setPreviews] = useState<Readonly<Record<string, UserTitleState>>>({});

  const plusOne = useCallback(
    (view: TitleView, isUpNext: boolean) => {
      if (previews[view.id]) return;
      const result = transition(view.facts, view.state, PLUS_ONE);
      if (!result.ok) {
        toast(errorMessage(result.error));
        return;
      }
      if (!navigator.onLine) {
        toast(OFFLINE_MESSAGE);
        return;
      }
      const next = result.value;
      const finishing = next?.status === "complete";
      const delay = finishing ? 450 : isUpNext ? 0 : 300;
      if (delay > 0 && next) setPreviews((p) => ({ ...p, [view.id]: next }));
      setTimeout(async () => {
        if (finishing) celebrate();
        await library.change(view, PLUS_ONE, (undo) => {
          const message = changeMessage(view, next, PLUS_ONE);
          if (message) {
            toast(message, { action: { label: "Undo", onClick: () => void library.change({ ...view, state: next }, undo, () => toast("Undone")) } });
          }
        });
        setPreviews(({ [view.id]: _done, ...rest }) => rest);
      }, delay);
    },
    [library, previews],
  );

  return { plusOne, previews };
}
