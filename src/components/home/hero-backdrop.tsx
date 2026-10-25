"use client";

import { cn } from "cn";
import { useState } from "react";
import { Poster } from "@/components/primitives/poster";
import type { TitleView } from "@/domain/view";

/**
 * The picture behind the "Up next" card. The blurred poster shows first and gives way to the title's backdrop once it has
 * loaded. The backdrop drifts very slowly, and a scrim keeps the words readable on a bright image.
 */
export function HeroBackdrop({ view }: { view: TitleView }) {
  const [loadedBackdrop, setLoadedBackdrop] = useState<string | null>(null);
  const loaded = view.backdrop !== null && loadedBackdrop === view.backdrop;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
      <div className={cn("absolute -inset-10 opacity-50 transition-opacity duration-700 [filter:blur(46px)_saturate(1.5)]", loaded && "opacity-0")}>
        <Poster src={view.poster?.w342 ?? null} title={view.title} compact className="aspect-auto size-full rounded-none after:hidden" />
      </div>
      {view.backdrop && (
        // eslint-disable-next-line @next/next/no-img-element -- backdrops come straight from the provider's CDN, never through the host's optimizer (catalog-data.md)
        <img
          key={view.backdrop}
          ref={(img) => {
            if (img?.complete && img.naturalWidth > 0) setLoadedBackdrop(view.backdrop);
          }}
          src={view.backdrop}
          alt=""
          decoding="async"
          onLoad={() => setLoadedBackdrop(view.backdrop)}
          className={cn("absolute inset-0 size-full max-w-none animate-[drift_28s_ease-in-out_infinite_alternate] object-cover opacity-0 transition-opacity duration-700 motion-reduce:animate-none", loaded && "opacity-50")}
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--surface)_6%,transparent_80%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,var(--surface),transparent)]" />
    </div>
  );
}
