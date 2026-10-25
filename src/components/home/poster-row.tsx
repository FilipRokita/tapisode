"use client";

import { cn } from "cn";
import { useRef } from "react";
import { useOverlays } from "@/components/app-shell/overlays";
import { Poster } from "@/components/primitives/poster";
import { ScrollRail } from "@/components/primitives/scroll-rail";
import { TiltPoster } from "@/components/primitives/tilt-poster";
import { airDateLabel } from "@/domain/countdown";
import type { BrowseRow } from "@/domain/view";
import { SECTION_HEADING, stagger } from "./stagger";

/** How many titles a row shows from `md` up, where it is a grid and does not scroll. */
const DESKTOP_COUNT = 6;

function Tile({ row, index, ranked, dated }: { row: BrowseRow; index: number; ranked: boolean; dated: boolean }) {
  const { openTitle } = useOverlays();
  const button = useRef<HTMLButtonElement>(null);
  return (
    <li className={cn("w-[132px] shrink-0 snap-start md:w-auto", index >= DESKTOP_COUNT && "md:hidden")}>
      <button ref={button} type="button" onClick={() => openTitle(row.ref, button.current)} className="block w-full text-left">
        <TiltPoster>
          <Poster src={row.poster?.w185 ?? null} title={row.title} className="w-full">
            {ranked && (
              <span aria-hidden="true" className="mono pointer-events-none absolute bottom-0.5 left-2 text-[54px] leading-none font-black text-transparent [-webkit-text-stroke:2px_rgb(255_255_255/0.9)] [filter:drop-shadow(0_2px_6px_rgb(0_0_0/0.6))]">
                {index + 1}
              </span>
            )}
            {dated && row.releaseDate && <span className="mono absolute top-2 left-2 rounded-full border border-border-strong bg-badge-bg px-2 py-0.5 text-[11px]">{airDateLabel(row.releaseDate)}</span>}
          </Poster>
        </TiltPoster>
        <span className="mt-2 line-clamp-1 block text-[13.5px] font-semibold">{row.title}</span>
        {row.year && <span className="block text-[12px] text-faint">{row.year}</span>}
      </button>
    </li>
  );
}

interface PosterRowProps {
  id: string;
  title: string;
  rows: readonly BrowseRow[];
  /** Numbers the titles 1, 2, 3 and so on. */
  ranked?: boolean;
  /** Shows each title's release date on its poster. */
  dated?: boolean;
  /** Where the section sits in the page's entrance. */
  k: number;
}

/** A titled row of posters. A rail on a phone, a grid of six from `md` up. A tap opens the title's drawer. */
export function PosterRow({ id, title, rows, ranked = false, dated = false, k }: PosterRowProps) {
  const s = stagger(k);
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby={id} className={cn("mt-[26px]", s.className)} style={s.style}>
      <h2 id={id} className={cn(SECTION_HEADING, "mb-3")}>
        {title}
      </h2>
      <ScrollRail className="-mx-4 snap-x snap-proximity overflow-x-auto scroll-px-4 px-4 md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex w-max gap-3 md:grid md:w-auto md:grid-cols-6 md:gap-4">
          {rows.map((row, i) => (
            <Tile key={`${row.ref.type}:${row.ref.externalId}`} row={row} index={i} ranked={ranked} dated={dated} />
          ))}
        </ul>
      </ScrollRail>
    </section>
  );
}
