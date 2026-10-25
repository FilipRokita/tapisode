"use client";

import { cn } from "cn";
import Link from "next/link";
import { ChevronRight } from "@/components/primitives/icons";
import { Poster } from "@/components/primitives/poster";
import { ScrollRail } from "@/components/primitives/scroll-rail";
import { describeTitle } from "@/components/library/title-info";
import type { TitleView } from "@/domain/view";

/** How many titles the strip shows before it points to the whole Watching list. */
const SHOWN = 4;

/** The titles in Watching as small posters under the hero. Choosing one puts it in the hero. The last tile, the same size as the others, leads to the whole list. */
export function HeroSwitcher({ titles, selectedId, onSelect }: { titles: readonly TitleView[]; selectedId: string; onSelect: (id: string) => void }) {
  if (titles.length < 2) return null;
  return (
    <ScrollRail className="-mx-4 overflow-x-auto px-4 pt-1 pb-1 md:mx-0 md:overflow-visible md:px-0">
      <ul aria-label="Choose what to continue" className="flex items-end gap-3">
        {titles.slice(0, SHOWN).map((t) => {
          const active = t.id === selectedId;
          const info = describeTitle(t);
          return (
            <li key={t.id} className="shrink-0">
              <button type="button" aria-label={t.title} aria-pressed={active} onClick={() => onSelect(t.id)} className="group block w-[58px] text-left md:w-[64px]">
                <Poster
                  src={t.poster?.w185 ?? null}
                  title={t.title}
                  compact
                  className={cn("w-full transition-[opacity,scale,box-shadow] duration-300 ease-app", active ? "shadow-[0_0_0_2px_var(--brand)]" : "opacity-55 group-hover:opacity-90 group-hover:scale-[1.04]")}
                />
                <span aria-hidden="true" className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-surface-3">
                  <i className={cn("block h-full rounded-full transition-[width,background-color] duration-500 ease-app", active ? "bg-brand-text" : "bg-border-strong")} style={{ width: `${info.finished ? 100 : info.percent}%` }} />
                </span>
              </button>
            </li>
          );
        })}
        <li className="shrink-0">
          <Link href="/app/watching" aria-label={`All ${titles.length} in Watching`} className="group block w-[58px] md:w-[64px]">
            <span className="grid aspect-[2/3] w-full place-content-center justify-items-center gap-0.5 rounded-[12px] border border-dashed border-border-strong bg-surface text-dim transition-colors group-hover:border-brand-edge group-hover:bg-brand-soft group-hover:text-foreground">
              <span className="text-[11px] font-semibold tracking-[0.08em] uppercase">All</span>
              <b className="mono text-[20px] leading-none font-bold tracking-[-0.04em] text-foreground">{titles.length}</b>
              <ChevronRight className="size-4" />
            </span>
            <span aria-hidden="true" className="mt-1.5 block h-[3px]" />
          </Link>
        </li>
      </ul>
    </ScrollRail>
  );
}
