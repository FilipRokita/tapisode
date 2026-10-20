"use client";

import { Command as Cmdk } from "cmdk";
import { useState } from "react";
import { STATUS_LABEL } from "@/components/copy";
import { Search } from "@/components/primitives/icons";
import { Kbd } from "@/components/primitives/kbd";
import { Poster } from "@/components/primitives/poster";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { SearchRow } from "@/domain/view";
import { refToParam } from "@/components/drawer/title-ref";
import { useOverlays } from "@/components/app-shell/overlays";
import { MIN_QUERY, useSearch } from "./use-search";

interface SearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ row, onChoose }: { row: SearchRow; onChoose: (row: SearchRow) => void }) {
  return (
    <Cmdk.Item
      value={refToParam(row.ref)}
      onSelect={() => onChoose(row)}
      className="flex cursor-pointer items-center gap-3 rounded-[14px] p-2 data-[selected=true]:bg-surface-2"
    >
      <Poster src={row.poster?.w92 ?? null} title={row.title} compact className="w-11 rounded-[8px]" />
      <div className="min-w-0 flex-1">
        <b className="block truncate text-[14.5px] tracking-[-0.01em]">{row.title}</b>
        <small className="text-[12.5px] text-faint">
          {row.ref.type === "tv" ? "Series" : "Movie"}
          {row.year ? ` · ${row.year}` : ""}
        </small>
      </div>
      {row.state && <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11.5px] font-semibold text-dim">In {STATUS_LABEL[row.state.status]}</span>}
    </Cmdk.Item>
  );
}

/** The search palette. Choosing a row closes it and opens the title, where the list is chosen. There are no buttons in rows. */
export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const { openTitle } = useOverlays();
  const [query, setQuery] = useState("");
  const state = useSearch(open, query);
  const typing = query.trim().length >= MIN_QUERY;

  const choose = (row: SearchRow) => {
    onOpenChange(false);
    setTimeout(() => openTitle(row.ref), 0);
  };
  const close = (next: boolean) => {
    if (!next) setQuery("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="top-[max(12vh,calc(20px+var(--safe-top)))] grid-cols-[minmax(0,1fr)] w-[min(620px,calc(100%-24px))] max-w-none translate-y-0 gap-0 overflow-hidden rounded-[20px] border-border-strong p-0 shadow-[var(--shadow-sheet)] sm:max-w-none"
      >
        <DialogTitle className="sr-only">Search titles</DialogTitle>
        <DialogDescription className="sr-only">Search movies and shows, then pick one to open it.</DialogDescription>
        <Cmdk shouldFilter={false} loop label="Search titles" className="min-w-0">
          <div className="flex items-center gap-2.5 border-b border-border px-4">
            <Search className="size-5 shrink-0 text-dim" />
            <Cmdk.Input value={query} onValueChange={setQuery} placeholder="Search movies and shows" aria-label="Search" autoFocus className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-faint" />
            <Kbd className="[@media(hover:none)]:hidden">esc</Kbd>
          </div>
          <Cmdk.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
            {state.status === "error" ? (
              <p role="alert" className="px-2 py-6 text-center text-[14.5px] text-dim">
                {state.message}
              </p>
            ) : state.status === "loading" ? (
              <p className="px-2 py-6 text-center text-[14.5px] text-faint">Loading…</p>
            ) : state.rows.length === 0 ? (
              <div className="grid justify-items-center gap-1.5 px-2 py-8 text-center text-dim">
                <div className="mb-1 grid size-16 place-items-center rounded-[20px] bg-surface-2 text-faint">
                  <Search className="size-5" />
                </div>
                <h3 className="text-lg font-bold tracking-[-0.02em] text-foreground">No matches</h3>
                <p>Try a different title.</p>
              </div>
            ) : (
              <>
                {!typing && <div className="eyebrow px-2 pt-2 pb-1.5">Popular right now</div>}
                {state.rows.map((row) => (
                  <Row key={refToParam(row.ref)} row={row} onChoose={choose} />
                ))}
              </>
            )}
          </Cmdk.List>
        </Cmdk>
      </DialogContent>
    </Dialog>
  );
}
