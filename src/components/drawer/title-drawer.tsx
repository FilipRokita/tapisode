"use client";

import { cn } from "cn";
import type { ElementType } from "react";
import { useRunCommand } from "@/components/library/use-run-command";
import { useAmbientHue } from "@/components/library/use-ambient-hue";
import { X } from "@/components/primitives/icons";
import { Poster } from "@/components/primitives/poster";
import { Skeleton } from "@/components/primitives/skeleton";
import { TiltPoster } from "@/components/primitives/tilt-poster";
import { Button } from "@/components/ui/button";
import { isReleased } from "@/domain/progress";
import type { Command } from "@/domain/transitions";
import type { TitleView } from "@/domain/view";
import { EpisodeStrip } from "./episode-strip";
import { ProgressPanel } from "./progress-panel";
import { StatusControl } from "./status-control";
import type { DrawerTitle } from "./use-drawer-title";
import { WhereToWatch } from "./where-to-watch";

interface BodyProps {
  title: DrawerTitle;
  region: string;
  onClose: () => void;
  /** The dialog title component of the surface the body sits in (Radix Dialog or vaul). */
  Heading: ElementType;
  /** True for the first moment after opening, while the sections stagger in. */
  entering: boolean;
}

const stateChip = (view: TitleView): { label: string; soft: boolean } => {
  if (view.facts.type === "movie") return { label: isReleased(view.facts) ? "Released" : "Not released", soft: false };
  if (view.facts.state === "ended") return { label: "Ended", soft: false };
  if (view.facts.state === "upcoming") return { label: "Upcoming", soft: false };
  return { label: "Returning", soft: true };
};

const section = (k: number, entering: boolean) => ({
  className: cn(entering && "animate-[section-in_0.55s_var(--ease)_backwards] [animation-delay:calc(var(--k)*55ms+140ms)]"),
  style: { "--k": k } as React.CSSProperties,
});

function Ready({ view, region, onClose, Heading, entering }: Omit<BodyProps, "title"> & { view: TitleView }) {
  const run = useRunCommand();
  const hue = useAmbientHue(view.poster?.w185 ?? null);
  const command = (c: Command) => void run(view, c);
  const series = view.facts.type === "tv" ? view.facts : null;
  const facts = series
    ? [`${series.seasons.length} season${series.seasons.length === 1 ? "" : "s"}`, view.runtimeMinutes ? `${view.runtimeMinutes} min episodes` : null]
    : [view.runtimeMinutes ? `${Math.floor(view.runtimeMinutes / 60)}h ${view.runtimeMinutes % 60}m` : null];
  const chip = stateChip(view);

  return (
    <div className="hue relative" style={{ "--h": hue } as React.CSSProperties}>
      <div aria-hidden="true" className="pointer-events-none absolute -top-10 -right-10 -left-10 -z-10 h-[270px] opacity-60 [filter:blur(46px)_saturate(1.5)] [mask-image:linear-gradient(#000_20%,transparent_92%)] md:h-[310px]">
        <Poster src={view.poster?.w342 ?? null} title={view.title} compact className="aspect-auto size-full rounded-none after:hidden" />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[260px] bg-[radial-gradient(closest-side_at_30%_0%,var(--glow-strong),transparent_80%)]" />
      <div className="mb-3 flex items-center justify-between">
        <span className="eyebrow">
          {view.facts.type === "tv" ? "Series" : "Movie"}
          {view.year ? ` · ${view.year}` : ""}
        </span>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose} className="-my-2 -mr-2.5">
          <X />
        </Button>
      </div>
      <div className={cn("flex items-end gap-[18px]", section(0, entering).className)} style={section(0, entering).style}>
        <TiltPoster className="w-[116px] shrink-0 drop-shadow-[0_18px_30px_rgb(0_0_0/0.55)] md:w-[176px]">
          <Poster src={view.poster?.w342 ?? null} title={view.title} className="w-full [view-transition-name:title-poster]" eager />
        </TiltPoster>
        <div className="min-w-0 flex-1 pb-1 md:pb-2">
          <Heading className="text-[27px] leading-[1.05] font-extrabold tracking-[-0.04em] [text-wrap:balance] md:text-4xl">{view.title}</Heading>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-[9px] gap-y-1.5 text-[13px] text-dim">
            {facts.filter(Boolean).map((f) => (
              <span key={f} className="after:ml-[9px] after:inline-block after:size-[3px] after:rounded-full after:bg-border-strong after:align-middle after:content-['']">
                {f}
              </span>
            ))}
            <span className={cn("rounded-full border px-[9px] py-0.5 text-[11.5px] font-semibold", chip.soft ? "border-brand-edge bg-brand-soft text-brand-text" : "border-border text-dim")}>{chip.label}</span>
          </div>
        </div>
      </div>
      {view.overview && (
        <p className={cn("mt-[18px] mb-1 text-[15px] leading-[1.55] text-text-soft", section(0, entering).className)} style={section(0, entering).style}>
          {view.overview}
        </p>
      )}
      <div className="mt-[18px] grid gap-[22px] md:grid-cols-[1.15fr_1fr] md:items-start">
        <div className={cn("md:row-span-2", section(1, entering).className)} style={section(1, entering).style}>
          <ProgressPanel view={view} run={command} />
        </div>
        <div className={section(2, entering).className} style={section(2, entering).style}>
          <StatusControl view={view} onChange={(status) => command({ kind: "setStatus", status })} />
        </div>
        {series && (
          <div className={cn("md:col-span-2 md:row-start-3", section(3, entering).className)} style={section(3, entering).style}>
            <EpisodeStrip facts={series} state={view.state} run={command} />
          </div>
        )}
        <div className={cn("md:col-start-2 md:row-start-2", section(4, entering).className)} style={section(4, entering).style}>
          <WhereToWatch view={view} region={region} />
        </div>
      </div>
    </div>
  );
}

export function TitleDrawerBody({ title, region, onClose, Heading, entering }: BodyProps) {
  if (title.status === "ready") return <Ready view={title.view} region={region} onClose={onClose} Heading={Heading} entering={entering} />;
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <Heading className="eyebrow">{title.status === "loading" ? "Loading" : "Title"}</Heading>
        <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose} className="-my-2 -mr-2.5">
          <X />
        </Button>
      </div>
      {title.status === "loading" ? (
        <div aria-busy="true" className="grid gap-3.5">
          <div className="flex items-end gap-[18px]">
            <Skeleton className="aspect-[2/3] w-[116px] md:w-[176px]" />
            <Skeleton className="h-16 flex-1" />
          </div>
          <Skeleton className="h-24" />
          <Skeleton className="h-36 rounded-[20px]" />
        </div>
      ) : (
        <p role="alert" className="py-8 text-center text-dim">
          {title.message}
        </p>
      )}
    </div>
  );
}
