"use client";

import { cn } from "cn";
import { useRef, useState, type ReactNode } from "react";
import { useOverlays } from "@/components/app-shell/overlays";
import { episodeCode } from "@/components/copy";
import { ChevronLeft, ChevronRight } from "@/components/primitives/icons";
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

const WEEK = 7;

const rangeOf = (week: readonly AgendaDay<TitleView>[]): string => {
  const [, d1, m1] = airDateLabel(week[0]!.date).split(" ");
  const [, d2, m2] = airDateLabel(week[week.length - 1]!.date).split(" ");
  return m1 === m2 ? `${d1} – ${d2} ${m1}` : `${d1} ${m1} – ${d2} ${m2}`;
};

const count = (week: readonly AgendaDay<TitleView>[]): number => week.reduce((n, d) => n + d.entries.length, 0);

/**
 * The coming weeks, one week at a time: seven columns on a line, with the user's series that have an episode on each day.
 * Arrows page between weeks, and a dot for each week says where there is something to see. Today's node glows.
 */
export function WeekAgenda({ days, next, today }: WeekAgendaProps) {
  const { openTitle } = useOverlays();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const weeks = Array.from({ length: Math.ceil(days.length / WEEK) }, (_, i) => days.slice(i * WEEK, (i + 1) * WEEK));
  const week = weeks[index] ?? weeks[0]!;
  const empty = weeks.every((w) => count(w) === 0);
  const later = weeks.findIndex((w, i) => i > index && count(w) > 0);

  const go = (to: number) => {
    setDirection(to > index ? 1 : -1);
    setIndex(to);
  };

  const controls = (
    <span className="inline-flex items-center gap-1">
      <span className="mono mr-2 text-[13px] text-text-soft" aria-live="polite">
        {rangeOf(week)}
      </span>
      <PageButton label="Previous week" disabled={index === 0} onClick={() => go(index - 1)}>
        <ChevronLeft />
      </PageButton>
      <span className="hidden items-center md:inline-flex">
        {weeks.map((w, i) => (
          <button key={w[0]!.date} type="button" aria-label={`${rangeOf(w)}, ${count(w) === 0 ? "nothing airs" : `${count(w)} episode${count(w) === 1 ? "" : "s"}`}`} aria-current={i === index ? "true" : undefined} onClick={() => go(i)} className="group grid size-5 place-items-center">
            <i className={cn("block rounded-full transition-all duration-200", i === index ? "size-2.5 bg-foreground" : count(w) > 0 ? "size-2 bg-brand group-hover:scale-125" : "size-1.5 bg-border-strong group-hover:scale-125")} />
          </button>
        ))}
      </span>
      <PageButton label="Next week" disabled={index === weeks.length - 1} onClick={() => go(index + 1)}>
        <ChevronRight />
      </PageButton>
    </span>
  );

  return (
    <section aria-labelledby="coming-up" className="mt-10 md:mt-12">
      <SectionHeading id="coming-up" aside={empty ? null : controls}>
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
        <div key={index} className={cn("animate-[week-in_0.45s_var(--ease)_backwards]", direction === 1 ? "[--from:18px]" : "[--from:-18px]")}>
          {count(week) === 0 && (
            <p className="mb-4 flex flex-wrap items-center gap-x-2 text-[14.5px] text-dim">
              <span>Nothing airs this week.</span>
              {later >= 0 && (
                <button type="button" onClick={() => go(later)} className="text-text-soft underline decoration-border-strong underline-offset-4 transition-colors hover:text-foreground">
                  Jump to {rangeOf(weeks[later]!)}
                </button>
              )}
            </p>
          )}
          <ScrollRail className="-mx-4 -mt-3 snap-x snap-proximity overflow-x-auto scroll-px-4 px-4 pt-3 pb-2 md:mx-0 md:overflow-visible md:px-0">
            <ol className="relative flex w-max gap-3 md:grid md:w-auto md:grid-cols-7">
              <i aria-hidden="true" className="absolute top-[5px] right-0 left-0 h-px bg-[linear-gradient(90deg,var(--brand-edge),var(--home-line)_30%,var(--home-line)_92%,transparent)]" />
              {week.map((day) => {
                const isToday = day.daysAway === 0;
                const [weekday, dayNumber, month] = airDateLabel(day.date).split(" ");
                return (
                  <li key={day.date} className={cn("relative w-[124px] shrink-0 snap-start pt-7 md:w-auto", day.entries.length === 0 && !isToday && "opacity-70")}>
                    <i aria-hidden="true" className={cn("absolute top-0 left-0 block size-[11px] rounded-full border-2", isToday ? "border-brand bg-brand shadow-[0_0_0_4px_var(--brand-ring)]" : "border-border-strong bg-background")} />
                    {isToday && <i aria-hidden="true" className="absolute top-0 left-0 block size-[11px] rounded-full bg-brand motion-safe:animate-[ring-out_2.2s_ease-out_infinite]" />}
                    <div className="mb-3 flex items-baseline gap-2">
                      <span className={cn("mono text-[26px] leading-none font-bold tracking-[-0.04em]", isToday ? "text-brand-text" : "text-foreground")}>{dayNumber}</span>
                      <span className={cn("eyebrow whitespace-nowrap", isToday && "text-brand-text")}>{isToday ? "Today" : weekday}</span>
                      {(Number(dayNumber) === 1 || (day === week[0] && index > 0)) && <span className="eyebrow whitespace-nowrap text-brand-text">{month}</span>}
                    </div>
                    {day.entries.length > 0 ? (
                      <ul className="grid gap-3.5">
                        {day.entries.map((e) => (
                          <Entry key={e.view.id} entry={e} daysAway={day.daysAway} open={openTitle} />
                        ))}
                      </ul>
                    ) : (
                      <div aria-hidden="true" className="h-[72px] rounded-[14px] border border-dashed border-border" />
                    )}
                  </li>
                );
              })}
            </ol>
          </ScrollRail>
        </div>
      )}
    </section>
  );
}

function PageButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className="grid size-11 place-items-center rounded-[12px] text-text-soft transition-colors hover:bg-surface-2 hover:text-foreground disabled:pointer-events-none disabled:opacity-30 md:size-9 [&_svg]:size-5">
      {children}
    </button>
  );
}
