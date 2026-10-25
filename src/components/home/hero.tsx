"use client";

import { cn } from "cn";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useOverlays } from "@/components/app-shell/overlays";
import { Check, Clock } from "@/components/primitives/icons";
import { Poster } from "@/components/primitives/poster";
import { RollingNumber } from "@/components/primitives/rolling-number";
import { ServiceChip } from "@/components/primitives/service-chip";
import { TiltPoster } from "@/components/primitives/tilt-poster";
import { prefersReducedMotion } from "@/components/primitives/use-reduced-motion";
import { Button } from "@/components/ui/button";
import { PlusButton } from "@/components/library/plus-button";
import { describeTitle } from "@/components/library/title-info";
import { useAmbientHue } from "@/components/library/use-ambient-hue";
import { useToday } from "@/components/library/use-today";
import { countdownLabel } from "@/domain/countdown";
import type { UserTitleState } from "@/domain/types";
import type { TitleView } from "@/domain/view";

interface HeroProps {
  view: TitleView;
  /** A state shown for a moment before the list changes (see usePlusOne). */
  preview?: UserTitleState;
  onPlus: () => void;
  onMarkWatched: () => void;
  className?: string;
}

/**
 * The title the user left off at, as a cinematic card: its backdrop fills it and drifts, the words rise out of a blur, and
 * a line along the bottom draws the progress. The pointer moves the picture and the poster a little against each other.
 */
export function Hero({ view, preview, onPlus, onMarkWatched, className }: HeroProps) {
  const shown = preview ? { ...view, state: preview } : view;
  const info = describeTitle(shown);
  const button = describeTitle(view);
  const hue = useAmbientHue(view.poster?.w185 ?? null);
  const today = useToday();
  const { openTitle } = useOverlays();
  const card = useRef<HTMLElement>(null);
  const posterBox = useRef<HTMLDivElement>(null);
  const [loadedBackdrop, setLoadedBackdrop] = useState<string | null>(null);
  const backdropLoaded = view.backdrop !== null && loadedBackdrop === view.backdrop;
  const countdown = today && info.caughtUp ? countdownLabel(view.nextEpisode?.airDate ?? null, today) : null;
  const percent = info.finished ? 100 : info.percent;

  // Scrolling away: the picture lags, the words lift, and the card dims a little as the page moves over it.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      card.current?.style.setProperty("--sp", String(Math.min(1, Math.max(0, window.scrollY / 520))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // The poster flies into the drawer. Only the visible one may, not the blurred copy behind the card, and a phone shows none.
  const open = () => openTitle(view.ref, posterBox.current && posterBox.current.offsetParent !== null ? posterBox.current : null);

  const parallax = (event: PointerEvent<HTMLElement>) => {
    const el = card.current;
    if (!el || !window.matchMedia("(hover: hover)").matches || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String((event.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--py", String((event.clientY - r.top) / r.height - 0.5));
  };
  const rest = () => {
    card.current?.style.setProperty("--px", "0");
    card.current?.style.setProperty("--py", "0");
  };

  return (
    <section
      ref={card}
      onPointerMove={parallax}
      onPointerLeave={rest}
      aria-label="Up next"
      className={cn("hue relative isolate flex min-h-[430px] flex-col justify-end overflow-hidden rounded-[28px] border border-border-strong bg-surface md:min-h-[470px] md:flex-row md:items-end md:justify-between md:gap-8", className)}
      style={{ "--h": hue, "--px": 0, "--py": 0, "--sp": 0, opacity: "calc(1 - var(--sp) * 0.5)", transform: "scale(calc(1 - var(--sp) * 0.04))", transformOrigin: "50% 0" } as CSSProperties}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className={cn("absolute -inset-10 opacity-60 transition-opacity duration-700 [filter:blur(46px)_saturate(1.6)]", backdropLoaded && "opacity-0")}>
          <Poster src={view.poster?.w342 ?? null} title={view.title} compact className="aspect-auto size-full rounded-none after:hidden" />
        </div>
        {view.backdrop && (
          <div className="absolute -inset-5 [transform:translate3d(0,calc(var(--sp)*70px),0)]">
            <div className="size-full transition-transform duration-300 ease-out [transform:translate3d(calc(var(--px)*-14px),calc(var(--py)*-9px),0)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- backdrops come straight from the provider's CDN, never through the host's optimizer (catalog-data.md) */}
              <img
                key={view.backdrop}
                ref={(img) => {
                  if (img?.complete && img.naturalWidth > 0) setLoadedBackdrop(view.backdrop);
                }}
                src={view.backdrop}
                alt=""
                decoding="async"
                onLoad={() => setLoadedBackdrop(view.backdrop)}
                className={cn("size-full max-w-none animate-[settle_1.6s_var(--ease)_both,drift_32s_ease-in-out_1.6s_infinite_alternate] object-cover opacity-0 transition-opacity duration-1000 motion-reduce:animate-none", backdropLoaded && "opacity-90")}
              />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--background)_4%,transparent_58%)] max-md:hidden" />
        <div className="absolute inset-x-0 bottom-0 h-4/5 bg-[linear-gradient(to_top,var(--background)_10%,transparent)] md:h-3/5 md:bg-[linear-gradient(to_top,var(--background)_6%,transparent)]" />
        <div className="absolute -right-[10%] -bottom-[30%] h-[90%] w-3/5 bg-[radial-gradient(closest-side,var(--glow-strong),transparent_70%)]" />
      </div>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-end gap-3 p-5 pb-7 [transform:translate3d(0,calc(var(--sp)*-30px),0)] md:max-w-[640px] md:gap-4 md:p-9 md:pb-10">
        <div className="flex flex-wrap items-center gap-2 animate-[blur-in_0.7s_var(--ease)_0.1s_backwards]">
          <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-brand-edge bg-brand-soft px-3 py-1 text-brand-text">
            <i aria-hidden="true" className="block size-1.5 rounded-full bg-brand-text motion-safe:animate-pulse" />
            Up next
          </span>
          {(view.services ?? []).slice(0, 2).map((s) => (
            <ServiceChip key={s} service={s} />
          ))}
        </div>
        <h2 className="animate-[blur-in_0.8s_var(--ease)_0.2s_backwards] text-[44px] leading-[0.95] font-extrabold tracking-[-0.05em] [text-shadow:var(--text-shadow)] [text-wrap:balance] md:text-[68px]">
          <button type="button" onClick={open} className="text-left">
            {view.title}
            <span className="sr-only">, open details</span>
          </button>
        </h2>
        {info.isSeries ? (
          <div className="mono flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] text-text-soft animate-[blur-in_0.8s_var(--ease)_0.3s_backwards]" title="Last watched">
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <Check className="size-5 text-brand-text" aria-hidden="true" />
              <RollingNumber value={info.stamp} />
            </span>
            <span className="font-sans text-[13.5px] text-dim">
              {info.watched} of {info.aired} episodes watched
            </span>
            {countdown && (
              <span className="inline-flex items-center gap-1.5 font-sans text-[13px] text-brand-text">
                <Clock className="size-4" aria-hidden="true" />
                {countdown}
              </span>
            )}
          </div>
        ) : (
          <div className="mono text-[15px] text-text-soft">{info.runtime}</div>
        )}
        {view.overview && <p className="line-clamp-3 max-w-[54ch] text-[15px] leading-[1.55] text-text-soft animate-[blur-in_0.8s_var(--ease)_0.4s_backwards] max-md:hidden">{view.overview}</p>}
        <div className="mt-1 flex flex-wrap items-center gap-2.5 animate-[blur-in_0.8s_var(--ease)_0.5s_backwards]">
          {info.isSeries ? (
            <PlusButton
              tone="white"
              className="mt-0 min-h-[52px] w-full px-7 text-base md:w-auto"
              label={button.caughtUp ? "Caught up" : button.finished ? "Finished" : "+1 Episode"}
              target={button.caughtUp || button.finished ? null : info.target ? `→ ${info.target}` : null}
              caught={button.caughtUp || button.finished}
              onPress={onPlus}
            />
          ) : (
            <PlusButton tone="white" className="mt-0 min-h-[52px] w-full px-7 text-base md:w-auto" label="Mark as watched" onPress={onMarkWatched} />
          )}
          <Button variant="secondary" onClick={open} className="hidden min-h-[52px] bg-background/40 px-6 backdrop-blur-md md:inline-flex">
            Details
          </Button>
        </div>
      </div>

      <div ref={posterBox} className="relative z-10 hidden shrink-0 pr-12 pb-12 md:block">
        <TiltPoster className="w-[210px] drop-shadow-[0_26px_44px_rgb(0_0_0/0.65)] transition-transform duration-300 ease-out [transform:translate3d(calc(var(--px)*10px),calc(var(--py)*6px),0)_rotate(3deg)]">
          <Poster src={view.poster?.w342 ?? null} title={view.title} className="w-full" eager />
        </TiltPoster>
      </div>

      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-[3px] bg-border">
        <i className="block h-full origin-left animate-[draw_1.4s_var(--ease)_0.6s_backwards] bg-[linear-gradient(90deg,var(--brand),var(--brand-text))] transition-[width] duration-[600ms] ease-app" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
