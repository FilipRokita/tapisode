"use client";

import { cn } from "cn";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { ChevronRight } from "@/components/primitives/icons";
import { Poster } from "@/components/primitives/poster";
import { useCountUp } from "@/components/primitives/use-count-up";
import type { Backlog, CatchUp } from "@/domain/home";
import type { TitleView } from "@/domain/view";
import { SectionHeading } from "./section-heading";

const CIRCUMFERENCE = 100.5;

/** A ring that draws itself to `percent`, stroked from the accent to its light tone. */
function Ring({ percent }: { percent: number }) {
  const id = useId();
  const [drawn, setDrawn] = useState(0);
  const shown = useCountUp(percent, 1200);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setDrawn(percent));
    return () => cancelAnimationFrame(frame);
  }, [percent]);
  return (
    <div className="relative size-[132px] shrink-0 md:size-[148px]" role="img" aria-label={`${percent}% of what aired is watched`}>
      <svg viewBox="0 0 38 38" className="size-full -rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--brand)" }} />
            <stop offset="100%" style={{ stopColor: "var(--brand-text)" }} />
          </linearGradient>
        </defs>
        <circle cx="19" cy="19" r="16" fill="none" className="stroke-surface-3" strokeWidth="2.6" />
        <circle cx="19" cy="19" r="16" fill="none" stroke={`url(#${id})`} strokeWidth="2.6" strokeLinecap="round" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE * (1 - drawn / 100)} className="transition-[stroke-dashoffset] duration-[1400ms] ease-app" />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <b className="mono text-[34px] leading-none font-bold tracking-[-0.04em] md:text-[38px]">
          {shown}
          <small className="text-[16px] text-dim">%</small>
        </b>
        <span className="mt-1 text-[11.5px] text-faint">watched</span>
      </div>
    </div>
  );
}

function ShowBar({ item, index, ready }: { item: CatchUp<TitleView>; index: number; ready: boolean }) {
  return (
    <li className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
      <Poster src={item.view.poster?.w92 ?? null} title={item.view.title} compact className="w-7 rounded-[6px]" />
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="truncate text-[13.5px] font-semibold">{item.view.title}</span>
        </div>
        <div className="mt-1.5 h-[5px] overflow-hidden rounded-[3px] bg-surface-3" aria-hidden="true">
          <i className="block h-full origin-left rounded-[3px] bg-[linear-gradient(90deg,var(--brand),var(--brand-text))] transition-[width] duration-[1100ms] ease-app" style={{ width: ready ? `${item.percent}%` : "0%", transitionDelay: `${index * 90}ms` }} />
        </div>
      </div>
      <span className="mono text-[12px] text-dim">{item.left} left</span>
    </li>
  );
}

interface NumbersProps {
  backlog: Backlog;
  items: readonly CatchUp<TitleView>[];
  finished: number;
  tracked: number;
}

/** One panel for the user's own lists: how much of what aired is watched, what is left and where, and how many are done. */
export function Numbers({ backlog, items, finished, tracked }: NumbersProps) {
  const left = useCountUp(backlog.episodes);
  const done = useCountUp(finished);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <section aria-labelledby="your-numbers" className="mt-10 md:mt-12">
      <SectionHeading id="your-numbers" aside={<Link href="/app/stats" className="inline-flex min-h-11 items-center gap-0.5 transition-colors hover:text-foreground md:min-h-9">All stats<ChevronRight className="size-4" /></Link>}>
        Your numbers
      </SectionHeading>
      <div className="relative isolate overflow-hidden rounded-[24px] border border-border bg-surface p-5 md:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -top-1/2 -left-[10%] -z-10 h-[140%] w-1/2 bg-[radial-gradient(closest-side,var(--brand-soft-strong),transparent_70%)]" />
        <div className="grid gap-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-10">
          <div className="flex items-center gap-6 md:gap-8">
            <Ring percent={backlog.percent} />
            <div className="md:hidden">
              <Tally left={left} episodes={backlog.episodes} hours={backlog.hours} />
            </div>
          </div>
          <div className="min-w-0">
            <div className="hidden md:block">
              <Tally left={left} episodes={backlog.episodes} hours={backlog.hours} />
            </div>
            {items.length > 0 && (
              <ul className={cn("grid gap-3.5 md:mt-5", "max-md:mt-0")}>
                {items.slice(0, 4).map((item, i) => (
                  <ShowBar key={item.view.id} item={item} index={i} ready={ready} />
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-baseline gap-3 border-t border-border pt-5 md:block md:border-t-0 md:border-l md:pt-0 md:pl-10">
            <b className="mono block text-[44px] leading-none font-bold tracking-[-0.05em] md:text-[56px]" aria-hidden="true">
              {done}
            </b>
            <span className="sr-only">{finished}</span>
            <span className="block text-[13px] text-dim md:mt-2">
              titles finished
              <small className="block text-[12px] text-faint">{tracked} tracked</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tally({ left, episodes, hours }: { left: number; episodes: number; hours: number }) {
  return (
    <div>
      <b className="mono block text-[44px] leading-none font-bold tracking-[-0.05em] md:text-[56px]">
        <span aria-hidden="true">{left}</span>
        <span className="sr-only">{episodes}</span>
      </b>
      <span className="mt-2 block text-[13.5px] text-text-soft">{episodes === 0 ? "All caught up" : `episodes to catch up, about ${hours} h`}</span>
    </div>
  );
}
