"use client";

import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { PageHeader } from "@/components/app-shell/page-header";
import { Bookmark, CircleCheck } from "@/components/primitives/icons";
import { EmptyState } from "@/components/primitives/empty-state";
import { Button } from "@/components/ui/button";
import { filterServices, matchesServices } from "@/domain/lists";
import { SERVICE_KEYS, type ServiceKey } from "@/domain/services";
import type { Status } from "@/domain/types";
import { FilterChips } from "./filter-chips";
import { useLibrary } from "./library-provider";
import { PosterTile } from "./poster-tile";
import { useFlipList } from "./use-flip-list";

const FILTER_PARAM = "s";

const parseFilter = (value: string | null): ServiceKey[] => (value ?? "").split(",").filter((k): k is ServiceKey => (SERVICE_KEYS as readonly string[]).includes(k));

/** Writes the filter into the address without leaving the page, so a reload keeps it and Back undoes it. */
function pushFilter(selected: readonly ServiceKey[]) {
  const params = new URLSearchParams(window.location.search);
  if (selected.length > 0) params.set(FILTER_PARAM, selected.join(","));
  else params.delete(FILTER_PARAM);
  const query = params.toString();
  window.history.pushState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

export function GridView({ status }: { status: Extract<Status, "watchlist" | "complete"> }) {
  const { titles } = useLibrary();
  const search = useSearchParams();
  const grid = useRef<HTMLDivElement>(null);
  useFlipList(grid);

  const all = titles.filter((t) => t.state?.status === status);
  const offered = filterServices(all.map((t) => ({ services: t.services ?? [] })), SERVICE_KEYS);
  // A service no title carries any more cannot stay selected.
  const selected = new Set(parseFilter(search.get(FILTER_PARAM)).filter((k) => offered.includes(k)));
  const shown = all.filter((t) => matchesServices({ services: t.services ?? [] }, selected));

  const toggle = (service: ServiceKey) => {
    const next = new Set(selected);
    if (!next.delete(service)) next.add(service);
    pushFilter(SERVICE_KEYS.filter((k) => next.has(k)));
  };

  const isWatchlist = status === "watchlist";
  const title = isWatchlist ? "Watchlist" : "Complete";
  const sub = isWatchlist ? `${all.length} ${all.length === 1 ? "title" : "titles"} waiting for you` : `${all.length} finished`;

  return (
    <>
      <PageHeader title={title} sub={sub} />
      {all.length === 0 ? (
        <EmptyState icon={isWatchlist ? Bookmark : CircleCheck} title="Nothing here yet" text={isWatchlist ? "Save shows and movies you want to watch later." : "Titles you finish will show up here."} />
      ) : (
        <>
          <FilterChips offered={offered} selected={selected} onToggle={toggle} onClear={() => pushFilter([])} />
          <div ref={grid} className="relative mt-4 grid grid-cols-2 gap-3 md:grid-cols-[repeat(auto-fill,minmax(168px,1fr))] md:gap-[18px]">
            {shown.map((view) => (
              <PosterTile key={view.id} view={view} />
            ))}
          </div>
          {shown.length === 0 && (
            <div className="mt-4 text-center text-dim">
              <p>Nothing on these services.</p>
              <Button variant="ghost" className="mt-1" onClick={() => pushFilter([])}>
                Clear the filter
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
