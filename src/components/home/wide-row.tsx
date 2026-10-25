"use client";

import { cn } from "cn";
import { useRef } from "react";
import { useOverlays } from "@/components/app-shell/overlays";
import { Poster } from "@/components/primitives/poster";
import { ScrollRail } from "@/components/primitives/scroll-rail";
import type { BrowseRow } from "@/domain/view";
import { SectionHeading } from "./section-heading";

const DESKTOP_COUNT = 6;

function Card({ row, index }: { row: BrowseRow; index: number }) {
  const { openTitle } = useOverlays();
  const button = useRef<HTMLButtonElement>(null);
  return (
    <li className={cn("w-[272px] shrink-0 snap-start md:w-auto", index >= DESKTOP_COUNT && "md:hidden")}>
      <button
        ref={button}
        type="button"
        onClick={() => openTitle(row.ref, button.current)}
        className="relative block aspect-[16/10] w-full overflow-hidden rounded-[20px] border border-border bg-surface text-left shadow-[var(--shadow-poster)] transition-[scale,border-color] duration-[250ms] ease-app hover:border-border-strong md:hover:scale-[1.03] active:scale-[0.98]"
      >
        {row.backdrop ? (
          // eslint-disable-next-line @next/next/no-img-element -- backdrops come straight from the provider's CDN, never through the host's optimizer (catalog-data.md)
          <img src={row.backdrop} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="absolute inset-0 size-full object-cover" />
        ) : (
          <Poster src={row.poster?.w185 ?? null} title={row.title} compact className="absolute inset-0 aspect-auto size-full rounded-none opacity-60 [filter:blur(18px)] after:hidden" />
        )}
        <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,var(--background)_4%,transparent_62%)]" />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3.5">
          <span className="min-w-0">
            <span className="line-clamp-2 block text-[17px] leading-[1.15] font-bold tracking-[-0.02em] [text-shadow:var(--text-shadow)]">{row.title}</span>
            {row.year && <span className="mt-0.5 block text-[12px] text-text-soft">{row.year}</span>}
          </span>
          <span aria-hidden="true" className="eyebrow shrink-0 rounded-full border border-border-strong bg-badge-bg px-2.5 py-1 text-[10.5px] text-text-soft backdrop-blur-md">
            In cinemas
          </span>
        </span>
      </button>
    </li>
  );
}

/** Wide cards that show each title's still, for what is in cinemas. A rail on a phone, a grid of three from `md` up. */
export function WideRow({ id, title, rows }: { id: string; title: string; rows: readonly BrowseRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-10 md:mt-12">
      <SectionHeading id={id}>{title}</SectionHeading>
      <ScrollRail className="-mx-4 snap-x snap-proximity overflow-x-auto scroll-px-4 px-4 pt-1.5 pb-3 md:mx-0 md:overflow-visible md:px-0">
        <ul className="flex w-max gap-3.5 md:grid md:w-auto md:grid-cols-3 md:gap-5">
          {rows.map((row, i) => (
            <Card key={`${row.ref.type}:${row.ref.externalId}`} row={row} index={i} />
          ))}
        </ul>
      </ScrollRail>
    </section>
  );
}
