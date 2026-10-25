"use client";

import { cn } from "cn";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { isAired, isStarted } from "@/domain/progress";
import type { Command } from "@/domain/transitions";
import type { SeriesFacts, UserTitleState } from "@/domain/types";

interface EpisodeStripProps {
  facts: SeriesFacts;
  state: UserTitleState | null;
  run: (command: Command) => void;
}

/** Season chips and a grid of episodes. One violet marker slides to the current episode. */
export function EpisodeStrip({ facts, state, run }: EpisodeStripProps) {
  const position = state?.position ?? { season: 0, episode: 0 };
  const [chosen, setChosen] = useState<number | null>(null);
  const tab = chosen ?? (isStarted(position) ? position.season : (facts.seasons[0]?.number ?? 1));
  const season = facts.seasons.find((s) => s.number === tab) ?? facts.seasons[0];
  const grid = useRef<HTMLDivElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const lastTab = useRef<number | null>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const hasTabs = facts.seasons.length > 1;

  // Each edge of the season chips fades only while more chips lie beyond it.
  useEffect(() => {
    const el = tabs.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft > 1, end: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
    update();
    el.addEventListener("scroll", update);
    const resize = new ResizeObserver(update);
    resize.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
    };
  }, [hasTabs]);

  useLayoutEffect(() => {
    const place = (animate: boolean) => {
      const m = marker.current;
      const current = grid.current?.querySelector<HTMLElement>("[data-current]");
      if (!m) return;
      if (!current) {
        m.style.opacity = "0";
        return;
      }
      // Layout metrics, so the pop animation on a button cannot skew them.
      m.style.transition = animate ? "" : "none";
      m.style.opacity = "1";
      m.style.width = `${current.offsetWidth}px`;
      m.style.height = `${current.offsetHeight}px`;
      m.style.transform = `translate(${current.offsetLeft}px, ${current.offsetTop}px)`;
    };
    place(lastTab.current === tab);
    lastTab.current = tab;
    // The drawer is still sliding in on first open, so place the marker again once it has settled, and on resize.
    const settle = setTimeout(() => place(false), 700);
    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(settle);
      window.removeEventListener("resize", onResize);
    };
  }, [tab, position.season, position.episode]);

  if (!season) return null;
  const watchedCount = tab === position.season ? position.episode : tab < position.season ? season.episodeCount : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="eyebrow mb-2.5">Episodes</span>
        <span className="mono text-[12.5px] text-dim">
          {watchedCount} / {season.episodeCount}
        </span>
      </div>
      {hasTabs && (
        <div
          ref={tabs}
          role="tablist"
          aria-label="Season"
          className="mb-3 flex gap-1.5 overflow-x-auto"
          style={{ maskImage: `linear-gradient(to right, ${edges.start ? "transparent" : "#000"}, #000 32px, #000 calc(100% - 32px), ${edges.end ? "transparent" : "#000"})` }}
        >
          {facts.seasons.map((s) => (
            <button
              key={s.number}
              type="button"
              role="tab"
              aria-selected={s.number === tab}
              aria-pressed={undefined}
              onClick={() => setChosen(s.number)}
              className={cn(
                "min-h-11 shrink-0 rounded-full border px-3.5 text-[13.5px] font-medium whitespace-nowrap transition-colors md:min-h-9",
                s.number === tab ? "border-foreground bg-foreground text-on-light" : "border-border text-text-soft hover:border-border-strong hover:bg-surface-2",
              )}
            >
              Season {s.number}
            </button>
          ))}
        </div>
      )}
      <div ref={grid} className="relative grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-2">
        <span
          ref={marker}
          aria-hidden="true"
          data-marker
          className="pointer-events-none absolute top-0 left-0 z-0 h-0 w-0 rounded-[12px] border-[1.5px] border-brand bg-brand-soft opacity-0 shadow-[0_0_0_3px_var(--brand-ring)] transition-[transform,width,height,opacity] duration-[400ms] ease-app"
        />
        {Array.from({ length: season.episodeCount }, (_, i) => {
          const episode = i + 1;
          const target = { season: tab, episode };
          const aired = isAired(target, facts.seasons);
          const seen = tab < position.season || (tab === position.season && episode <= position.episode);
          const current = tab === position.season && episode === position.episode;
          return (
            <button
              key={episode}
              type="button"
              disabled={!aired}
              data-current={current ? "" : undefined}
              data-episode={`${tab}-${episode}`}
              aria-label={`Season ${tab} episode ${episode}${seen ? ", watched" : !aired ? ", not aired yet" : ""}`}
              aria-current={current ? "true" : undefined}
              onClick={() => run({ kind: "jumpTo", position: target })}
              className={cn(
                "mono relative z-[1] aspect-square min-h-11 rounded-[12px] border text-sm font-semibold transition-[transform,background-color,border-color,color] duration-100 active:scale-[.94]",
                !aired && "cursor-not-allowed border-dashed border-border opacity-40",
                aired && !seen && !current && "border-border bg-surface-2 text-dim hover:border-border-strong hover:text-foreground",
                aired && seen && !current && "border-transparent bg-surface-3 text-foreground",
                current && "border-transparent bg-transparent text-foreground",
              )}
            >
              {episode}
            </button>
          );
        })}
      </div>
    </div>
  );
}
