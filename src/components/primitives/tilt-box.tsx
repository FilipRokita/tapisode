"use client";

import { cn } from "cn";
import { useRef } from "react";
import { tiltMove, tiltReset } from "./effects";

/** Tilts itself toward the cursor. `strength` scales the angle and the growth (the wide closing card uses 0.3). */
export function TiltBox({ children, className, strength = 1 }: { children: React.ReactNode; className?: string; strength?: number }) {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={box}
      className={cn("transition-[transform,box-shadow] duration-[250ms] ease-app will-change-transform", className)}
      onPointerMove={(e) => tiltMove(e, box.current, 800, 12, strength)}
      onPointerLeave={() => tiltReset(box.current)}
    >
      {children}
    </div>
  );
}
