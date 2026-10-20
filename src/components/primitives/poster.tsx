"use client";

import { cn } from "cn";
import { useState } from "react";
import { Film } from "./icons";

interface PosterProps {
  src: string | null;
  title: string;
  className?: string;
  /** Hide the title written over a missing poster (small thumbnails). */
  compact?: boolean;
  /** Load straight away, for the poster the visitor is looking at. */
  eager?: boolean;
}

/** A 2:3 poster. It shimmers while the image loads and fades in. Without an image it shows a film icon and the title. */
export function Poster({ src, title, className, compact = false, eager = false }: PosterProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      data-poster
      className={cn(
        "relative aspect-[2/3] shrink-0 overflow-hidden rounded-[12px] bg-poster-bg after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[inset_0_0_0_1px_var(--ring-inset)] after:content-['']",
        !src && "bg-gradient-to-br from-poster-fallback-a to-poster-fallback-b",
        className,
      )}
    >
      {src ? (
        <>
          {!loaded && <div className="skeleton absolute inset-0 rounded-none" />}
          {/* eslint-disable-next-line @next/next/no-img-element -- posters come straight from the provider's CDN, never through the host's optimizer (catalog-data.md) */}
          <img
            ref={(node) => {
              if (node?.complete && node.naturalWidth > 0) setLoaded(true);
            }}
            src={src}
            alt=""
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={cn("absolute inset-0 size-full object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
          />
        </>
      ) : (
        !compact && (
          <>
            <div className="absolute inset-x-0 top-0 bottom-[38%] grid place-items-center text-border-strong">
              <Film className="w-[34%] h-auto" strokeWidth={1.2} />
            </div>
            <div className="absolute inset-x-2.5 bottom-2.5 text-[13px] leading-[1.15] font-bold tracking-[-0.01em] [text-shadow:var(--text-shadow)]">{title}</div>
          </>
        )
      )}
    </div>
  );
}
