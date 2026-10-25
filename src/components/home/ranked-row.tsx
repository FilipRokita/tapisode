"use client";

import { useRef } from "react";
import { useOverlays } from "@/components/app-shell/overlays";
import { Poster } from "@/components/primitives/poster";
import { ScrollRail } from "@/components/primitives/scroll-rail";
import { TiltPoster } from "@/components/primitives/tilt-poster";
import type { BrowseRow } from "@/domain/view";
import { SectionHeading } from "./section-heading";

function Tile({ row, index }: { row: BrowseRow; index: number }) {
  const { openTitle } = useOverlays();
  const button = useRef<HTMLButtonElement>(null);
  return (
    <li className="w-[140px] shrink-0 snap-start md:w-auto md:basis-[calc((100%-100px)/6)]">
      <button ref={button} type="button" onClick={() => openTitle(row.ref, button.current)} className="group block w-full text-left">
        <TiltPoster className="transition-transform duration-300 ease-app md:group-hover:-translate-y-1.5 [&_[data-poster]]:shadow-[var(--shadow-poster)] md:[&_[data-poster]]:group-hover:shadow-[var(--shadow-lift)]">
          <Poster src={row.poster?.w185 ?? null} title={row.title} className="w-full">
            <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,var(--background),transparent)] opacity-90" />
            <span aria-hidden="true" className="mono pointer-events-none absolute -bottom-1.5 left-1.5 bg-[linear-gradient(to_bottom,var(--foreground),var(--home-numeral))] bg-clip-text text-[84px] leading-[0.85] font-black tracking-[-0.06em] text-transparent">
              {index + 1}
            </span>
          </Poster>
        </TiltPoster>
        <span className="mt-2.5 line-clamp-1 block text-[13.5px] font-semibold">{row.title}</span>
        {row.year && <span className="block text-[12px] text-faint">{row.year}</span>}
      </button>
    </li>
  );
}

/** Posters with big rank numbers, in a row you scroll: by swipe on a phone, by the arrows on a desktop, six in view. A tap opens the title's drawer. */
export function RankedRow({ id, title, rows }: { id: string; title: string; rows: readonly BrowseRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-10 md:mt-12">
      <SectionHeading id={id}>{title}</SectionHeading>
      <ScrollRail always arrows className="-mx-4 snap-x snap-proximity overflow-x-auto scroll-px-4 px-4 pt-1.5 pb-3 md:mx-0 md:scroll-px-0 md:px-0">
        <ul className="flex gap-3.5 md:gap-5">
          {rows.map((row, i) => (
            <Tile key={`${row.ref.type}:${row.ref.externalId}`} row={row} index={i} />
          ))}
        </ul>
      </ScrollRail>
    </section>
  );
}
