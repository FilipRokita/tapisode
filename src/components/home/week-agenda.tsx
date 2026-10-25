"use client";

import { cn } from "cn";
import { useRef } from "react";
import { useOverlays } from "@/components/app-shell/overlays";
import { episodeCode } from "@/components/copy";
import { Poster } from "@/components/primitives/poster";
import { ScrollRail } from "@/components/primitives/scroll-rail";
import { TiltPoster } from "@/components/primitives/tilt-poster";
import { airDateLabel, daysUntil } from "@/domain/countdown";
import type { AgendaDay, AgendaEntry } from "@/domain/home";
import type { TitleRef } from "@/domain/types";
import type { TitleView } from "@/domain/view";
import { SectionHeading } from "./section-heading";

const when = (daysAway: number) => (daysAway === 0 ? "Today" : daysAway === 1 ? "Tomorrow" : `In ${daysAway} days`);

function Entry({ entry, daysAway, open }: { entry: AgendaEntry<TitleView>; daysAway: number; open: (ref: TitleRef, origin: HTMLElement) => void }) {
  const button = useRef<HTMLButtonElement>(null);
  const { view } = entry;
  return (
    <li>
      <button ref={button} type="button" onClick={() => open(view.ref, button.current!)} className="group block w-full text-left">
        <TiltPoster perspective={500} degrees={9} className="transition-transform duration-300 ease-app md:group-hover:-translate-y-1">
          <Poster src={view.poster?.w185 ?? null} title={view.title} compact className="w-full shadow-[var(--shadow-poster)]">
            <span className="mono absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,var(--background),transparent)] px-2 pt-6 pb-1.5 text-[11.5px] font-semibold">
              <span className="sr-only">Episode </span>
              {episodeCode(entry.season, entry.episode)}
            </span>
          </Poster>
        </TiltPoster>
        <span className="mt-2 line-clamp-1 block text-[12.5px] font-semibold">{view.title}</span>
        <span className={cn("block text-[11.5px]", daysAway === 0 ? "text-brand-text" : "text-faint")}>{when(daysAway)}</span>
      </button>
    </li>
  );
}

interface WeekAgendaProps {
  days: readonly AgendaDay<TitleView>[];
  /** The first episode after this week, shown when nothing airs in it. */
  next: { readonly view: TitleView; readonly airDate: string } | null;
  today: string;
}

/**
 * The next seven days from today on a line, with the user's series that have an episode on each day. A rail on a phone, a
 * row of seven columns on desktop. Today's node glows.
 */
export function WeekAgenda({ days, next, today }: WeekAgendaProps) {
  const { openTitle } = useOverlays();
  const empty = days.every((d) => d.entries.length === 0);
  return (
    <section aria-labelledby="coming-up" className="mt-10 md:mt-12">
      <SectionHeading id="coming-up" aside="Next 7 days">
        Coming up
      </SectionHeading>
      {empty ? (
        <p className="flex flex-wrap items-center gap-x-2 rounded-2xl border border-dashed border-border-strong px-5 py-6 text-[14.5px] text-dim">
          <span>Nothing airs from your shows this week.</span>
          {next && (
            <button type="button" onClick={() => openTitle(next.view.ref, null)} className="text-text-soft underline decoration-border-strong underline-offset-4 transition-colors hover:text-foreground">
              Next: {next.view.title}, {airDateLabel(next.airDate)} (in {daysUntil(next.airDate, today)} days)
            </button>
          )}
        </p>
      ) : (
        <ScrollRail className="-mx-4 snap-x snap-proximity overflow-x-auto scroll-px-4 px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
          <ol className="relative flex w-max gap-3 md:grid md:w-auto md:grid-cols-7">
            <i aria-hidden="true" className="absolute top-[5px] right-0 left-0 h-px bg-[linear-gradient(90deg,var(--brand-edge),var(--home-line)_30%,var(--home-line)_92%,transparent)]" />
            {days.map((day) => {
              const today = day.daysAway === 0;
              const [weekday, dayNumber] = airDateLabel(day.date).split(" ");
              return (
                <li key={day.date} className={cn("relative w-[124px] shrink-0 snap-start pt-7 md:w-auto", day.entries.length === 0 && !today && "opacity-60")}>
                  <i aria-hidden="true" className={cn("absolute top-0 left-0 block size-[11px] rounded-full border-2", today ? "border-brand bg-brand shadow-[0_0_0_4px_var(--brand-ring)]" : "border-border-strong bg-background")} />
                  {today && <i aria-hidden="true" className="absolute top-0 left-0 block size-[11px] rounded-full bg-brand motion-safe:animate-[ring-out_2.2s_ease-out_infinite]" />}
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className={cn("mono text-[26px] leading-none font-bold tracking-[-0.04em]", today ? "text-brand-text" : "text-foreground")}>{dayNumber}</span>
                    <span className={cn("eyebrow", today && "text-brand-text")}>{today ? "Today" : weekday}</span>
                  </div>
                  {day.entries.length > 0 && (
                    <ul className="grid gap-3.5">
                      {day.entries.map((e) => (
                        <Entry key={e.view.id} entry={e} daysAway={day.daysAway} open={openTitle} />
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </ScrollRail>
      )}
    </section>
  );
}
