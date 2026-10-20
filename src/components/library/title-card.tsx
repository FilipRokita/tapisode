"use client";

import { useRef } from "react";
import { countdownLabel } from "@/domain/countdown";
import { SERVICE_NAMES } from "@/domain/services";
import type { UserTitleState } from "@/domain/types";
import type { TitleView } from "@/domain/view";
import { useOverlays } from "@/components/app-shell/overlays";
import { Poster } from "@/components/primitives/poster";
import { ProgressBar } from "@/components/primitives/progress-bar";
import { RollingNumber } from "@/components/primitives/rolling-number";
import { ServiceDot } from "@/components/primitives/service-chip";
import { spotlightMove } from "@/components/primitives/effects";
import { PlusButton } from "./plus-button";
import { describeTitle } from "./title-info";
import { useToday } from "./use-today";

interface TitleCardProps {
  view: TitleView;
  /** A state shown for a moment before the list changes (see usePlusOne). */
  preview?: UserTitleState;
  onPlus: () => void;
  onMarkWatched: () => void;
}

/** A title in "Also watching": a series with its progress and `+1`, or a movie with "Mark as watched". */
export function TitleCard({ view, preview, onPlus, onMarkWatched }: TitleCardProps) {
  const shown = preview ? { ...view, state: preview } : view;
  const info = describeTitle(shown);
  const today = useToday();
  const article = useRef<HTMLElement>(null);
  const { openTitle } = useOverlays();
  const countdown = today && info.caughtUp ? countdownLabel(view.nextEpisode?.airDate ?? null, today) : null;
  const percent = info.finished ? 100 : info.percent;
  const service = info.firstService ? SERVICE_NAMES[info.firstService] : null;

  return (
    <article
      ref={article}
      data-flip={`${view.id}|card`}
      onPointerMove={spotlightMove}
      className="spotlight relative mb-2.5 flex gap-3.5 overflow-hidden rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-border-strong md:mb-0"
    >
      <Poster src={view.poster?.w185 ?? null} title={view.title} className="w-[84px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div>
          <h3 className="text-base leading-[1.2] font-bold tracking-[-0.02em]">
            <button type="button" onClick={() => openTitle(view.ref, article.current)} className="text-left after:absolute after:inset-0 after:content-['']">
              {view.title}
              <span className="sr-only">, open details</span>
            </button>
          </h3>
          <div className="mono mt-[5px] flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[12.5px] text-dim">
            {info.isSeries ? <RollingNumber value={info.stamp} /> : <span>{info.runtime}</span>}
            {service && (
              <>
                <span aria-hidden="true" className="text-border-strong">·</span>
                <span className="inline-flex items-center gap-1.5 overflow-hidden text-ellipsis font-sans text-faint">
                  <ServiceDot service={info.firstService!} />
                  {service}
                  {info.moreServices > 0 && ` +${info.moreServices}`}
                </span>
              </>
            )}
          </div>
        </div>
        {info.isSeries ? (
          <>
            <div className="flex items-center gap-2.5" aria-label={`${percent}% watched`}>
              <ProgressBar percent={percent} className="flex-1" />
              <span className="mono min-w-[3.4ch] text-right text-[11.5px] text-faint">{percent}%</span>
            </div>
            <PlusButton
              tone="soft"
              label={info.caughtUp ? "Caught up" : info.finished ? "Finished" : "+1 Episode"}
              target={info.caughtUp ? (countdown ? `· ${countdown}` : null) : info.finished ? null : info.target ? `→ ${info.target}` : null}
              caught={info.caughtUp || info.finished}
              onPress={onPlus}
            />
          </>
        ) : (
          <PlusButton tone="soft" label="Mark as watched" onPress={onMarkWatched} />
        )}
      </div>
    </article>
  );
}
