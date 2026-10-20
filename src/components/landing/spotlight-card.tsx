"use client";

import { cn } from "cn";
import { useRef } from "react";
import { spotlightMove, tiltMove, tiltReset } from "@/components/primitives/effects";

/** A card with a spotlight that follows the cursor and a tilt toward it. `tilt` scales the angle (0.3 for a wide card). */
export function SpotlightCard({ children, className, tilt = 1 }: { children: React.ReactNode; className?: string; tilt?: number }) {
  const card = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={card}
      className={cn("spotlight overflow-hidden transition-[transform,border-color,box-shadow] duration-[250ms] ease-app will-change-transform", className)}
      onPointerMove={(e) => {
        spotlightMove(e);
        tiltMove(e, card.current, 800, 12, tilt);
      }}
      onPointerLeave={() => tiltReset(card.current)}
    >
      {children}
    </div>
  );
}
