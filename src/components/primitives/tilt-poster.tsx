"use client";

import { cn } from "cn";
import { useRef } from "react";
import { tiltMove, tiltReset } from "./effects";

interface TiltPosterProps {
  children: React.ReactNode;
  className?: string;
  perspective?: number;
  degrees?: number;
}

/** Tilts the poster inside it toward the cursor, and presses it in while it is held. Needs hover, and no reduced motion. */
export function TiltPoster({ children, className, perspective = 600, degrees = 14 }: TiltPosterProps) {
  const box = useRef<HTMLDivElement>(null);
  const poster = () => box.current?.querySelector<HTMLElement>("[data-poster]") ?? null;
  return (
    <div
      ref={box}
      className={cn("[&_[data-poster]]:transition-[transform,box-shadow] [&_[data-poster]]:duration-[250ms] [&_[data-poster]]:ease-app [&_[data-poster]]:will-change-transform", className)}
      onPointerMove={(e) => tiltMove(e, poster(), perspective, degrees)}
      onPointerLeave={() => tiltReset(poster())}
      onPointerDown={() => {
        const p = poster();
        if (p) p.style.transform = "scale(0.97)";
      }}
      onPointerUp={() => tiltReset(poster())}
    >
      {children}
    </div>
  );
}
