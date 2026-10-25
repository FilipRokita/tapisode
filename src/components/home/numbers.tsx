"use client";

import { cn } from "cn";
import Link from "next/link";
import { ChevronRight } from "@/components/primitives/icons";
import { ProgressRing } from "@/components/primitives/progress-ring";
import { useCountUp } from "@/components/primitives/use-count-up";
import type { Backlog } from "@/domain/home";
import { SECTION_HEADING, stagger } from "./stagger";

function Tile({ label, value, sub }: { label: string; value: number; sub: string }) {
  const shown = useCountUp(value);
  return (
    <div className="rounded-2xl border border-border bg-surface p-3.5 md:p-4">
      <small className="text-[12px] text-faint md:text-[12.5px]">{label}</small>
      <b className="mt-1 block text-[28px] leading-[1.1] font-extrabold tracking-[-0.04em] [font-feature-settings:'tnum'] md:text-[34px]">
        <span aria-hidden="true">{shown}</span>
        <span className="sr-only">{value}</span>
      </b>
      <span className="mt-1 block text-[12px] text-dim md:text-[12.5px]">{sub}</span>
    </div>
  );
}

/** A few numbers about the user's own lists, derived from what is already loaded. */
export function Numbers({ backlog, finished, tracked, k }: { backlog: Backlog; finished: number; tracked: number; k: number }) {
  const s = stagger(k);
  return (
    <section aria-labelledby="your-numbers" className={cn("mt-[26px]", s.className)} style={s.style}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="your-numbers" className={SECTION_HEADING}>
          Your numbers
        </h2>
        <Link href="/app/stats" className="inline-flex min-h-11 items-center gap-0.5 text-[12.5px] text-dim transition-colors hover:text-foreground md:min-h-9">
          All stats
          <ChevronRight className="size-4" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2.5 md:gap-3">
        <Tile label="To catch up" value={backlog.episodes} sub={backlog.episodes === 0 ? "All caught up" : `about ${backlog.hours} h`} />
        <div className="grid content-between rounded-2xl border border-border bg-surface p-3.5 md:p-4">
          <small className="text-[12px] text-faint md:text-[12.5px]">Watched</small>
          <ProgressRing percent={backlog.percent} size={64} className="my-1.5" />
          <span className="text-[12px] text-dim md:text-[12.5px]">of what aired</span>
        </div>
        <Tile label="Finished" value={finished} sub={`${tracked} tracked`} />
      </div>
    </section>
  );
}
