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

/** How many dots fit across the axis before it scrolls. */
const VISIBLE = 6;

type Segment = { readonly kind: "day"; readonly day: AgendaDay<TitleView> } | { readonly kind: "gap"; readonly key: string; readonly count: number };

/** Today and the days with an episode stay as they are. Every run of empty days between them, even one day, becomes one gap. */
function segments(days: readonly AgendaDay<TitleView>[]): Segment[] {
  const out: Segment[] = [];
  let run: AgendaDay<TitleView>[] = [];
  const flush = () => {
    if (run.length > 0) out.push({ kind: "gap", key: `gap-${run[0]!.date}`, count: run.length });
    run = [];
  };
  for (const day of days) {
    if (day.daysAway !== 0 && day.entries.length === 0) run.push(day);
    else {
      flush();
      out.push({ kind: "day", day });
    }
  }
  // Empty days at the very end say nothing: the axis stops at the last dot.
  return out;
}

// The axis is a thick violet track with a soft glow. Each column draws its own piece, from its dot to the next one, so it runs unbroken and ends at the last dot.
const LINE = "before:absolute before:top-1 before:-right-1.5 before:-left-1.5 before:h-[3px] before:bg-[var(--brand-line)] before:shadow-[0_0_10px_var(--brand-ring)] first:before:left-0 first:before:rounded-l-full last:before:hidden";
// Today's piece starts at full strength and settles into the track's color.
const TODAY_LINE = "before:bg-[linear-gradient(90deg,var(--brand),var(--brand-line))]";

/**
 * The coming eight weeks as one axis: a line with a dot for each day, today's glowing, and the user's series on the days they
 * air, and a run of empty days is a short gap such as "2 days". About seven days fit across, and the arrows at the sides move it a week at a time (a phone swipes). A day with nothing is just
 * its date. 
 */
export function WeekAgenda({ days, next, today }: WeekAgendaProps) {
  const { openTitle } = useOverlays();
  const empty = days.every((d) => d.entries.length === 0);
  const segs = segments(days);
  // With few dots the axis stretches over the whole width, the last column keeping the room its poster needs. With more, six
  // fit across and the rest is scrolled to.
  const stretch = segs.length <= VISIBLE;
  const widthOf = (index: number) => (!stretch ? "md:w-auto md:basis-[calc((100%-60px)/6)]" : index === segs.length - 1 ? "md:w-[124px]" : "md:w-auto md:min-w-0 md:flex-1 md:shrink");
  return (
    <section aria-labelledby="coming-up" className="mt-10 md:mt-12">
      <SectionHeading id="coming-up">
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
        <ScrollRail always arrows className="-mx-4 -mt-1 snap-x snap-proximity overflow-x-auto scroll-px-4 px-4 pt-3 pb-2 md:-mx-9 md:scroll-px-9 md:px-9">
          <ol className="flex gap-3">
            {segs.map((segment, index) => {
              if (segment.kind === "gap") {
                return (
                  <li key={segment.key} aria-hidden="true" className={cn(LINE, "relative w-[112px] shrink-0 pt-7", widthOf(index))}>
                    <i className="absolute top-0 left-0 block size-[11px] rounded-full border-2 border-brand-edge bg-background" />
                    <span className="mono block pl-5 text-[12px] leading-[26px] text-faint">{segment.count === 1 ? "1 day" : `${segment.count} days`}</span>
                  </li>
                );
              }
              const { day } = segment;
              const isToday = day.daysAway === 0;
              const [weekday, dayNumber, month] = airDateLabel(day.date).split(" ");
              const first = Number(dayNumber) === 1;
              return (
                <li
                  key={day.date}
                  className={cn(
                    "relative w-[124px] shrink-0 snap-start pt-7",
                    widthOf(index),
                    LINE,
                    isToday && TODAY_LINE,
                  )}
                >
                  <i aria-hidden="true" className={cn("absolute top-0 left-0 block size-[11px] rounded-full border-2", isToday ? "border-brand bg-brand shadow-[0_0_0_4px_var(--brand-ring)]" : "border-brand-text bg-brand-text")} />
                  {isToday && <i aria-hidden="true" className="absolute top-0 left-0 block size-[11px] rounded-full bg-brand motion-safe:animate-[ring-out_2.2s_ease-out_infinite]" />}
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className={cn("mono text-[26px] leading-none font-bold tracking-[-0.04em]", isToday ? "text-brand-text" : "text-foreground")}>{dayNumber}</span>
                    <span className={cn("eyebrow whitespace-nowrap", isToday && "text-brand-text")}>{isToday ? "Today" : weekday}</span>
                    {first && <span className="eyebrow whitespace-nowrap text-brand-text">{month}</span>}
                  </div>
                  {day.entries.length > 0 && (
                    <ul className="grid w-[124px] max-w-full gap-3.5">
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
