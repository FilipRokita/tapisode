"use client";

import { createContext, useContext } from "react";
import type { TitleRef } from "@/domain/types";

/** What the pages can ask the shell to open. The shell owns the drawer and the search palette. */
export interface Overlays {
  readonly openSearch: () => void;
  /** Opens the title drawer. `origin` is the element whose poster should transition into it. */
  readonly openTitle: (ref: TitleRef, origin?: HTMLElement | null) => void;
}

export const OverlaysContext = createContext<Overlays>({ openSearch: () => {}, openTitle: () => {} });
export const useOverlays = (): Overlays => useContext(OverlaysContext);
