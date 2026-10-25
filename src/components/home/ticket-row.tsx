"use client";

import { cn } from "cn";
import { useRef } from "react";
import { useOverlays } from "@/components/app-shell/overlays";
import { useToday } from "@/components/library/use-today";
import { Poster } from "@/components/primitives/poster";
import { spotlightMove } from "@/components/primitives/effects";
import { ScrollRail } from "@/components/primitives/scroll-rail";
import { airDateLabel, daysUntil } from "@/domain/countdown";
import type { BrowseRow } from "@/domain/view";
import { SectionHeading } from "./section-heading";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DESKTOP_COUNT = 6;

function Ticket({ row, index }: { row: BrowseRow; index: number }) {
  const { openTitle } = useOverlays();
  const today = useToday();
  const button = useRef<HTMLButtonElement>(null);
  const date = row.releaseDate;
  const days = date && today ? daysUntil(date, today) : null;
  return (
    <li className={cn("w-[300px] shrink-0 snap-start md:w-auto", index >= DESKTOP_COUNT && "md:hidden")}>
      <button
        ref={button}
        type="button"
        onClick={() => openTitle(row.ref, button.current)}
        onPointerMove={spotlightMove}
        className="spotlight flex w-full items-stretch gap-4 overflow-hidden rounded-[20px] border border-border bg-surface p-3 text-left transition-colors hover:border-border-strong"
      >
        <Poster src={row.poster?.w185 ?? null} title={row.title} compact className="w-[84px] rounded-[12px] shadow-[var(--shadow-poster)]" />
        <span className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
          <span>
            <span className="line-clamp-2 block text-[15px] leading-[1.2] font-semibold">{row.title}</span>
            {row.year && <span className="mt-0.5 block text-[12px] text-faint">{row.year}</span>}
          </span>
          {date && (
            <span className="flex items-end justify-between gap-2">
              <span className="flex items-baseline gap-1.5 leading-none" aria-hidden="true">
                <b className="mono text-[34px] font-bold tracking-[-0.05em]">{Number(date.slice(8, 10))}</b>
                <i className="text-[11px] font-semibold tracking-[0.1em] text-dim uppercase not-italic">{MONTHS[Number(date.slice(5, 7)) - 1]}</i>
              </span>
              <span className="rounded-full border border-brand-edge bg-brand-soft px-2.5 py-1 text-[11.5px] whitespace-nowrap text-brand-text">
                <span className="sr-only">{airDateLabel(date)}, </span>
                {days === null ? "Soon" : days <= 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}
              </span>
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/** Cards for what comes out soon: the poster, and the release date big enough to read at a glance. */
export function TicketRow({ id, title, rows }: { id: string; title: string; rows: readonly BrowseRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-10 md:mt-12">
      <SectionHeading id={id}>{title}</SectionHeading>
      <ScrollRail className="-mx-4 snap-x snap-proximity overflow-x-auto scroll-px-4 px-4 pt-1.5 pb-3 md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex w-max gap-3.5 md:grid md:w-auto md:grid-cols-3 md:gap-5">
          {rows.map((row, i) => (
            <Ticket key={`${row.ref.type}:${row.ref.externalId}`} row={row} index={i} />
          ))}
        </ul>
      </ScrollRail>
    </section>
  );
}
