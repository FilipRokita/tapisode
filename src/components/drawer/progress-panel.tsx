"use client";

import { Check, Film } from "@/components/primitives/icons";
import { PlusButton } from "@/components/library/plus-button";
import { describeTitle } from "@/components/library/title-info";
import { useToday } from "@/components/library/use-today";
import { ProgressBar } from "@/components/primitives/progress-bar";
import { ProgressRing } from "@/components/primitives/progress-ring";
import { RollingNumber } from "@/components/primitives/rolling-number";
import { Button } from "@/components/ui/button";
import { airDateLabel, countdownLabel } from "@/domain/countdown";
import type { Command } from "@/domain/transitions";
import type { TitleView } from "@/domain/view";

export function ProgressPanel({ view, run }: { view: TitleView; run: (command: Command) => void }) {
  const info = describeTitle(view);
  const today = useToday();
  const inList = view.state !== null;
  const done = view.state?.status === "complete";

  if (!info.isSeries) {
    return (
      <div className="grid gap-3.5 rounded-[20px] border border-border bg-gradient-to-b from-prog-fade-a to-prog-fade-b p-4">
        <div className="flex items-center justify-between gap-3.5">
          <div>
            <div className="eyebrow mb-1.5">Your progress</div>
            <div className="text-[30px] leading-[1.1] font-semibold tracking-[-0.03em]">{done ? "Watched" : "Not watched yet"}</div>
            {info.runtime && <div className="mt-1.5 text-[13px] text-dim">{info.runtime}</div>}
          </div>
          <div className="grid size-16 shrink-0 place-items-center rounded-full border-[3px] border-border text-dim" aria-hidden="true">
            {done ? <Check className="size-[26px]" /> : <Film className="size-[26px]" />}
          </div>
        </div>
        {done ? (
          <Button variant="secondary" className="w-full" onClick={() => run({ kind: "setStatus", status: "watchlist" })}>
            Mark as not watched
          </Button>
        ) : (
          <PlusButton tone="white" label="Mark as watched" disabled={!info.released} onPress={() => run({ kind: "setStatus", status: "complete" })} className="mt-0" />
        )}
      </div>
    );
  }

  const countdown = today && info.caughtUp ? countdownLabel(view.nextEpisode?.airDate ?? null, today) : null;
  const sub = info.finished
    ? "You finished this series"
    : info.caughtUp
      ? `Caught up${view.nextEpisode ? ` · next episode ${airDateLabel(view.nextEpisode.airDate)}` : ""}`
      : `${info.watched} of ${info.aired} episodes watched${info.target ? ` · next ${info.target}` : ""}`;
  const percent = info.finished ? 100 : info.percent;

  return (
    <div className="grid gap-3.5 rounded-[20px] border border-border bg-gradient-to-b from-prog-fade-a to-prog-fade-b p-4">
      <div className="flex items-center justify-between gap-3.5">
        <div className="min-w-0">
          <div className="eyebrow mb-1.5">Your progress</div>
          <div className="mono text-[30px] leading-[1.1] font-semibold tracking-[-0.03em]">
            <RollingNumber value={inList ? info.stamp : "Not started"} />
          </div>
          <div className="mt-1.5 text-[13px] text-dim">{sub}</div>
        </div>
        <ProgressRing percent={percent} size={64} />
      </div>
      <ProgressBar percent={percent} />
      {info.finished ? (
        <Button variant="secondary" className="w-full" disabled>
          <Check />
          Finished
        </Button>
      ) : info.caughtUp ? (
        <PlusButton tone="white" label="Caught up" target={countdown ? `· ${countdown}` : null} caught className="mt-0" />
      ) : (
        <PlusButton tone="white" label="+1 Episode" target={info.target ? `→ ${info.target}` : null} disabled={!info.released} onPress={() => run({ kind: "plusOne" })} className="mt-0" />
      )}
    </div>
  );
}
