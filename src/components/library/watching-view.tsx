"use client";

import { useEffect, useRef } from "react";
import { Tv } from "@/components/primitives/icons";
import { EmptyState } from "@/components/primitives/empty-state";
import { PageHeader } from "@/components/app-shell/page-header";
import { useOverlays } from "@/components/app-shell/overlays";
import { Button } from "@/components/ui/button";
import { Search } from "@/components/primitives/icons";
import type { TitleView } from "@/domain/view";
import { useLibrary } from "./library-provider";
import { TitleCard } from "./title-card";
import { UpNext } from "./up-next";
import { useFlipList } from "./use-flip-list";
import { usePlusOne } from "./use-plus-one";
import { useMarkWatched } from "./use-set-status";

const isTyping = (el: Element | null) => !!el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName);

export function WatchingView() {
  const { titles, pending } = useLibrary();
  const { openSearch } = useOverlays();
  const { plusOne, previews } = usePlusOne();
  const markWatched = useMarkWatched();
  const list = useRef<HTMLDivElement>(null);
  useFlipList(list);

  const watching = titles.filter((t): t is TitleView => t.state?.status === "watching");
  const [upNext, ...rest] = watching;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "+" || event.metaKey || event.ctrlKey || isTyping(document.activeElement)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (upNext && upNext.facts.type === "tv") {
        event.preventDefault();
        plusOne(upNext, true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [upNext, plusOne]);

  return (
    <>
      <PageHeader title="Watching" sub={watching.length === 0 ? "Nothing in progress yet." : `${watching.length} in progress`} />
      {pending > 0 && <p className="mt-2 text-[13px] text-faint">{pending === 1 ? "1 title is loading" : `${pending} titles are loading`}</p>}
      {!upNext ? (
        <EmptyState
          icon={Tv}
          title="Nothing here yet"
          text="Search for a show and put it in Watching to start tracking."
          action={
            <Button variant="primary" className="needs-net" onClick={openSearch}>
              <Search />
              Search titles
            </Button>
          }
        />
      ) : (
        <div ref={list}>
          <UpNext view={upNext} preview={previews[upNext.id]} onPlus={() => plusOne(upNext, true)} onMarkWatched={() => markWatched(upNext)} />
          {rest.length > 0 && (
            <>
              <div className="mt-[26px] mb-3 flex items-baseline justify-between">
                <h2 className="text-[13px] font-semibold tracking-[0.08em] text-faint uppercase">Also watching</h2>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-3">
                {rest.map((view) => (
                  <TitleCard key={view.id} view={view} preview={previews[view.id]} onPlus={() => plusOne(view, false)} onMarkWatched={() => markWatched(view)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
