"use client";

import { useSyncExternalStore } from "react";
import type { DateString } from "@/domain/countdown";

const noSubscribe = () => () => {};

/** Today's date in the visitor's own zone as `YYYY-MM-DD`. Null during the server render, so the countdown appears after mount. */
export const useToday = (): DateString | null =>
  useSyncExternalStore(
    noSubscribe,
    () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    },
    () => null,
  );
