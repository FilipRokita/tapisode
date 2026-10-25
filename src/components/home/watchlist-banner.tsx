"use client";

import Link from "next/link";
import { useState } from "react";
import { useOverlays } from "@/components/app-shell/overlays";
import { ChevronLeft, ChevronRight } from "@/components/primitives/icons";
import { Poster } from "@/components/primitives/poster";
import { ServiceChip } from "@/components/primitives/service-chip";
import { Button } from "@/components/ui/button";
import type { TitleView } from "@/domain/view";

interface WatchlistBannerProps {
  /** Released titles on the Watchlist, the one that has waited longest first. */
  titles: readonly TitleView[];
  /** All titles on the Watchlist, released or not. */
  total: number;
  onStart: (view: TitleView) => void;
}

/**
 * A calm banner that suggests something from the Watchlist to start. It borrows the hero's look (a still, a scrim, big type)
 * but does not move. The arrows suggest another title.
 */
export function WatchlistBanner({ titles, total, onStart }: WatchlistBannerProps) {
  const { openTitle } = useOverlays();
  const [index, setIndex] = useState(0);
  if (titles.length === 0) return null;
  const view = titles[index % titles.length]!;
  const step = (by: number) => setIndex((i) => (i + by + titles.length) % titles.length);
  const seasons = view.facts.type === "tv" ? view.facts.seasons.length : null;
  const runtime = view.runtimeMinutes ? `${Math.floor(view.runtimeMinutes / 60)}h ${view.runtimeMinutes % 60}m` : null;
  const facts = [view.year, seasons !== null ? `${seasons} season${seasons === 1 ? "" : "s"}` : runtime].filter(Boolean);

  return (
    <section aria-labelledby="pick-up" className="relative isolate mt-10 overflow-hidden rounded-[24px] border border-border-strong bg-surface md:mt-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {view.backdrop ? (
          // eslint-disable-next-line @next/next/no-img-element -- backdrops come straight from the provider's CDN, never through the host's optimizer (catalog-data.md)
          <img key={view.backdrop} src={view.backdrop} alt="" loading="lazy" decoding="async" className="size-full animate-[fade-in_0.8s_var(--ease)_backwards] object-cover opacity-50" />
        ) : (
          <div className="size-full opacity-40 [filter:blur(40px)_saturate(1.4)]">
            <Poster src={view.poster?.w342 ?? null} title={view.title} compact className="aspect-auto size-full rounded-none after:hidden" />
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_8%,transparent_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,var(--background),transparent)]" />
      </div>
      <div key={view.id} className="flex items-center gap-5 p-5 md:gap-7 md:p-7">
        <Poster src={view.poster?.w185 ?? null} title={view.title} className="hidden w-[104px] shrink-0 shadow-[var(--shadow-poster)] md:block" />
        <div className="min-w-0 flex-1 animate-[blur-in_0.6s_var(--ease)_backwards]">
          <div className="flex flex-wrap items-center gap-2">
            <span id="pick-up" className="eyebrow rounded-full border border-border-strong bg-badge-bg px-3 py-1 text-text-soft backdrop-blur-md">
              Pick up something new
            </span>
            {(view.services ?? []).slice(0, 2).map((s) => (
              <span key={s} className="rounded-full bg-badge-bg backdrop-blur-md">
                <ServiceChip service={s} />
              </span>
            ))}
          </div>
          <h3 className="mt-3 text-[28px] leading-[1.02] font-extrabold tracking-[-0.04em] [text-wrap:balance] md:text-[38px]">
            <button type="button" onClick={() => openTitle(view.ref, null)} className="text-left">
              {view.title}
              <span className="sr-only">, open details</span>
            </button>
          </h3>
          <p className="mt-1.5 text-[13.5px] text-text-soft">{facts.join(" · ")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Button variant="primary" className="needs-net min-h-[46px] px-6" onClick={() => onStart(view)}>
              Start watching
            </Button>
            <Button asChild variant="secondary" className="min-h-[46px] bg-background/40 px-5 backdrop-blur-md">
              <Link href="/app/watchlist">Watchlist · {total}</Link>
            </Button>
          </div>
        </div>
        {titles.length > 1 && (
          <div className="flex shrink-0 items-center self-start md:self-center">
            <button type="button" aria-label="Previous suggestion" onClick={() => step(-1)} className="grid size-11 place-items-center rounded-[12px] text-dim transition-colors hover:bg-surface-2 hover:text-foreground">
              <ChevronLeft className="size-5" />
            </button>
            <button type="button" aria-label="Next suggestion" onClick={() => step(1)} className="grid size-11 place-items-center rounded-[12px] text-dim transition-colors hover:bg-surface-2 hover:text-foreground">
              <ChevronRight className="size-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
