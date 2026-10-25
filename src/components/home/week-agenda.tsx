"use client";

import { cn } from "cn";
import { useRef } from "react";
import { useOverlays } from "@/components/app-shell/overlays";
import { episodeCode } from "@/components/copy";
import { Poster } from "@/components/primitives/poster";
import { ScrollRail } from "@/components/primitives/scroll-rail";
import { TiltPoster } from "@/components/primitives/tilt-poster";
import { airDateLabel } from "@/domain/countdown";
import type { AgendaDay, AgendaEntry } from "@/domain/home";
import type { TitleRef } from "@/domain/types";
import type { TitleView } from "@/domain/view";
import { SECTION_HEADING, stagger } from "./stagger";

function Entry({ entry, open }: { entry: AgendaEntry<TitleView>; open: (ref: TitleRef, origin: HTMLElement) => void }) {
  const button = useRef<HTMLButtonElement>(null);
  const { view } = entry;
  return (
    <li>
      <button ref={button} type="button" onClick={() => open(view.ref, button.current!)} className="block w-full text-left">
        <TiltPoster perspective={500} degrees={10}>
          <Poster src={view.poster?.w185 ?? null} title={view.title} compact className="w-full" />
        </TiltPoster>
        <span className="mt-1.5 line-clamp-1 block text-xs font-semibold">{view.title}</span>
        <span className="mono block text-[11.5px] text-dim">
          <span className="sr-only">Episode </span>
          {episodeCode(entry.season, entry.episode)}
        </span>
      </button>
    </li>
  );
}

/** The next seven days from today, and which of the user's series have an episode on each. A rail on a phone, a row of seven columns on desktop. */
export function WeekAgenda({ days, k }: { days: readonly AgendaDay<TitleView>[]; k: number }) {
  const { openTitle } = useOverlays();
  const empty = days.every((d) => d.entries.length === 0);
  const s = stagger(k);
  return (
    <section aria-labelledby="coming-up" className={cn("mt-[26px]", s.className)} style={s.style}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="coming-up" className={SECTION_HEADING}>
          Coming up
        </h2>
        <span className="text-[12.5px] text-faint">Next 7 days</span>
      </div>
      {empty ? (
        <p className="rounded-2xl border border-dashed border-border-strong px-4 py-7 text-center text-[14.5px] text-dim">Nothing airs from your shows this week.</p>
      ) : (
        <ScrollRail className="-mx-4 snap-x snap-proximity overflow-x-auto scroll-px-4 px-4 md:mx-0 md:overflow-visible md:px-0">
          <ol className="flex w-max items-start gap-2.5 md:grid md:w-auto md:grid-cols-7">
            {days.map((day) => {
              const today = day.daysAway === 0;
              const [weekday, dayNumber] = airDateLabel(day.date).split(" ");
              return (
                <li key={day.date} className={cn("w-[128px] shrink-0 snap-start rounded-2xl border p-2.5 md:w-auto", today ? "border-brand-edge bg-brand-soft" : "border-border bg-surface")}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={cn("eyebrow flex items-center gap-1.5", today && "text-brand-text")}>
                      {today && <i aria-hidden="true" className="block size-1.5 rounded-full bg-brand-text motion-safe:animate-pulse" />}
                      {today ? "Today" : weekday}
                    </span>
                    <span className="mono text-xs text-faint">{dayNumber}</span>
                  </div>
                  {day.entries.length === 0 ? <div aria-hidden="true" className="h-[96px] rounded-xl border border-dashed border-border" /> : <ul className="grid gap-2.5">{day.entries.map((e) => <Entry key={e.view.id} entry={e} open={openTitle} />)}</ul>}
                </li>
              );
            })}
          </ol>
        </ScrollRail>
      )}
    </section>
  );
}
