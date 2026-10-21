"use client";

import { useSyncExternalStore } from "react";
import { Kbd } from "@/components/primitives/kbd";
import { Search } from "@/components/primitives/icons";
import { useOverlays } from "./overlays";

const isApple = () => /Mac|iPhone|iPad/.test(navigator.platform);
const noSubscribe = () => () => {};

/** The page title and subtitle, and on desktop the search field. */
export function PageHeader({ title, sub, children }: { title: string; sub: string; children?: React.ReactNode }) {
  const { openSearch } = useOverlays();
  const apple = useSyncExternalStore(noSubscribe, isApple, () => false);
  return (
    <>
      <div className="flex items-end justify-between gap-4 md:mb-5">
        <div>
          <h1 className="text-[30px] leading-[1.1] font-extrabold tracking-[-0.04em] md:text-4xl">{title}</h1>
          <p className="mt-1 text-[14.5px] text-dim">{sub}</p>
        </div>
        <button
          type="button"
          onClick={openSearch}
          className="needs-net hidden h-11 w-full max-w-[340px] items-center gap-2.5 rounded-[14px] border border-border bg-surface px-3.5 text-sm text-faint transition-colors hover:border-border-strong hover:text-dim md:flex"
        >
          <Search className="size-5" />
          <span>Search movies and shows</span>
          <Kbd className="ml-auto">{apple ? "⌘K" : "Ctrl K"}</Kbd>
        </button>
      </div>
      {children}
    </>
  );
}
