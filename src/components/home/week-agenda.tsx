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
  /** The first episode after these days, shown when nothing airs in them. */
  next: { readonly view: TitleView; readonly airDate: string } | null;
  today: string;
}

type Segment = { readonly kind: "day"; readonly day: AgendaDay<TitleView>; readonly showMonth: boolean } | { readonly kind: "gap"; readonly key: string; readonly count: number };

/** Today and the days with an episode stay as they are, and each run of empty days between two of them becomes one short gap. The month is named where it changes. */
function segments(days: readonly AgendaDay<TitleView>[]): Segment[] {
  const out: Segment[] = [];
  let month = "";
  let quiet = 0;
  for (const day of days) {
    if (day.daysAway !== 0 && day.entries.length === 0) {
      quiet += 1;
      continue;
    }
    if (quiet > 0) out.push({ kind: "gap", key: `gap-${day.date}`, count: quiet });
    quiet = 0;
    const thisMonth = day.date.slice(0, 7);
    out.push({ kind: "day", day, showMonth: month !== "" && thisMonth !== month });
    month = thisMonth;
  }
  return out;
}

/**
 * The coming weeks on a line, with the user's series that have an episode on each day. Only today and the days with an episode
 * get a column, and the quiet days between them shrink to a short gap, so a month ahead is a short scroll. A phone swipes,
 * a mouse uses the arrows. Today's node glows.
 */
export function WeekAgenda({ days, next, today }: WeekAgendaProps) {
  const { openTitle } = useOverlays();
  const empty = days.every((d) => d.entries.length === 0);
  return (
    <section aria-labelledby="coming-up" className="mt-10 md:mt-12">
      <SectionHeading id="coming-up" aside={`Next ${days.length} days`}>
        Coming up
      </SectionHeading>
      {empty ? (
        <p className="flex flex-wrap items-center gap-x-2 rounded-2xl border border-dashed border-border-strong px-5 py-6 text-[14.5px] text-dim">
          <span>Nothing airs from your shows soon.</span>
          {next && (
            <button type="button" onClick={() => openTitle(next.view.ref, null)} className="text-text-soft underline decoration-border-strong underline-offset-4 transition-colors hover:text-foreground">
              Next: {next.view.title}, {airDateLabel(next.airDate)} (in {daysUntil(next.airDate, today)} days)
            </button>
          )}
        </p>
      ) : (
        <ScrollRail always arrows className="-mx-4 snap-x snap-proximity overflow-x-auto scroll-px-4 px-4 pb-2 md:mx-0 md:scroll-px-0 md:px-0">
          <ol className="relative flex w-max gap-3">
            {segments(days).map((segment) => {
              if (segment.kind === "gap") {
                return (
                  <li key={segment.key} aria-hidden="true" className="relative w-[58px] shrink-0 pt-7 text-center">
                    <span className="mono text-[11px] text-faint">{segment.count === 1 ? "1 day" : `${segment.count} days`}</span>
                  </li>
                );
              }
              const { day, showMonth } = segment;
              const isToday = day.daysAway === 0;
              const [weekday, dayNumber, month] = airDateLabel(day.date).split(" ");
              return (
                <li key={day.date} className="relative w-[124px] shrink-0 snap-start pt-7">
                  <i aria-hidden="true" className={cn("absolute top-0 left-0 block size-[11px] rounded-full border-2", isToday ? "border-brand bg-brand shadow-[0_0_0_4px_var(--brand-ring)]" : "border-border-strong bg-background")} />
                  {isToday && <i aria-hidden="true" className="absolute top-0 left-0 block size-[11px] rounded-full bg-brand motion-safe:animate-[ring-out_2.2s_ease-out_infinite]" />}
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className={cn("mono text-[26px] leading-none font-bold tracking-[-0.04em]", isToday ? "text-brand-text" : "text-foreground")}>{dayNumber}</span>
                    <span className={cn("eyebrow whitespace-nowrap", isToday && "text-brand-text")}>{isToday ? "Today" : weekday}{showMonth && ` · ${month}`}</span>
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
