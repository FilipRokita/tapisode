"use client";

import { useRef } from "react";
import { countdownLabel } from "@/domain/countdown";
import type { UserTitleState } from "@/domain/types";
import type { TitleView } from "@/domain/view";
import { useOverlays } from "@/components/app-shell/overlays";
import { Check, Clock, Film } from "@/components/primitives/icons";
import { Poster } from "@/components/primitives/poster";
import { ProgressBar } from "@/components/primitives/progress-bar";
import { RollingNumber } from "@/components/primitives/rolling-number";
import { ServiceChip } from "@/components/primitives/service-chip";
import { PlusButton } from "./plus-button";
import { describeTitle } from "./title-info";
import { useAmbientHue } from "./use-ambient-hue";
import { useToday } from "./use-today";

interface UpNextProps {
  view: TitleView;
  preview?: UserTitleState;
  onPlus: () => void;
  onMarkWatched: () => void;
}

/** The title with the newest activity, as a large card. The glow behind it takes its color from the poster. */
export function UpNext({ view, preview, onPlus, onMarkWatched }: UpNextProps) {
  const shown = preview ? { ...view, state: preview } : view;
  const info = describeTitle(shown);
  const button = describeTitle(view);
  const hue = useAmbientHue(view.poster?.w185 ?? null);
  const today = useToday();
  const section = useRef<HTMLElement>(null);
  const { openTitle } = useOverlays();
  const countdown = today && info.caughtUp ? countdownLabel(view.nextEpisode?.airDate ?? null, today) : null;
  const percent = info.finished ? 100 : info.percent;

  return (
    <section
      ref={section}
      data-flip={`${view.id}|hero`}
      className="hue relative isolate mt-1.5 overflow-hidden rounded-[22px] border border-border bg-surface p-4 md:p-6"
      style={{ "--h": hue } as React.CSSProperties}
    >
      <div aria-hidden="true" className="pointer-events-none absolute -top-[40%] -right-[20%] -z-10 h-[120%] w-4/5 bg-[radial-gradient(closest-side,var(--glow),transparent_70%)]" />
      <div className="eyebrow mb-3">Up next</div>
      <div className="flex gap-3.5 md:grid md:grid-cols-[150px_minmax(0,1fr)_minmax(280px,340px)] md:items-center md:gap-7">
        <Poster src={view.poster?.w342 ?? null} title={view.title} className="w-[104px] md:w-[150px]" eager />
        <div className="flex min-w-0 flex-1 flex-col md:contents">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">{(view.services ?? []).map((s) => <ServiceChip key={s} service={s} />)}</div>
            <h2 className="mt-1.5 mb-2 text-[22px] leading-[1.1] font-extrabold tracking-[-0.03em] md:text-[32px]">
              <button type="button" onClick={() => openTitle(view.ref, section.current)} className="text-left after:absolute after:inset-0 after:z-0 after:content-['']">
                {view.title}
                <span className="sr-only">, open details</span>
              </button>
            </h2>
            <p className="hidden max-w-[52ch] text-[15px] text-dim md:block">{view.overview}</p>
          </div>
          <div className="flex flex-col md:rounded-[18px] md:border md:border-border md:bg-panel-fill md:p-5">
            {info.isSeries ? (
              <>
                <div className="mono flex flex-wrap items-center gap-1.5 text-sm text-dim md:gap-y-1 md:text-2xl md:text-foreground" title="Last watched">
                  <Check className="size-5 md:text-dim" aria-hidden="true" />
                  <RollingNumber value={info.stamp} />
                  <span className="hidden basis-full font-sans text-[13px] text-faint md:block">
                    {info.watched} of {info.aired} episodes watched
                  </span>
                </div>
                <ProgressBar percent={percent} className="mt-2.5" />
                {countdown && (
                  <div className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] text-brand-text">
                    <Clock className="size-4" aria-hidden="true" />
                    {countdown}
                  </div>
                )}
                <PlusButton
                  tone="white"
                  className="mt-3.5 md:mt-[18px]"
                  label={button.caughtUp ? "Caught up" : button.finished ? "Finished" : "+1 Episode"}
                  target={button.caughtUp || button.finished ? null : info.target ? `→ ${info.target}` : null}
                  caught={button.caughtUp || button.finished}
                  onPress={onPlus}
                />
              </>
            ) : (
              <>
                <div className="mono flex items-center gap-1.5 text-sm text-dim md:text-2xl md:text-foreground">
                  <Film className="size-5 md:text-dim" aria-hidden="true" />
                  <span>{info.runtime}</span>
                </div>
                <PlusButton tone="white" className="mt-3.5 md:mt-[18px]" label="Mark as watched" onPress={onMarkWatched} />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
