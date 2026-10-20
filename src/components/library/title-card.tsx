"use client";

import { cn } from "cn";
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
  /** The landing demo: no way to open the title, and a plain button label without the target or the countdown. */
  compact?: boolean;
}

/** A title in "Also watching": a series with its progress and `+1`, or a movie with "Mark as watched". */
export function TitleCard({ view, preview, onPlus, onMarkWatched, compact = false }: TitleCardProps) {
  const shown = preview ? { ...view, state: preview } : view;
  const info = describeTitle(shown);
  // The button keeps its old words until the list changes, so a finishing title still reads +1 while its bar fills.
  const button = describeTitle(view);
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
      className={cn("spotlight relative mb-2.5 flex gap-3.5 overflow-hidden rounded-2xl border border-border bg-surface p-3 transition-colors hover:border-border-strong md:mb-0", compact && "mb-0 gap-2.5 p-2.5 md:mb-0")}
    >
      <Poster src={view.poster?.w185 ?? null} title={view.title} className="w-[84px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div>
          <h3 className="text-base leading-[1.2] font-bold tracking-[-0.02em]">
            {compact ? (
              view.title
            ) : (
              <button type="button" onClick={() => openTitle(view.ref, article.current)} className="text-left after:absolute after:inset-0 after:content-['']">
                {view.title}
                <span className="sr-only">, open details</span>
              </button>
            )}
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
              label={button.caughtUp ? "Caught up" : button.finished ? "Finished" : "+1 Episode"}
              target={compact ? null : button.caughtUp ? (countdown ? `· ${countdown}` : null) : button.finished ? null : info.target ? `→ ${info.target}` : null}
              caught={button.caughtUp || button.finished}
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
