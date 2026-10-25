"use client";

import { useRef } from "react";
import { useOverlays } from "@/components/app-shell/overlays";
import { Check } from "@/components/primitives/icons";
import { Poster } from "@/components/primitives/poster";
import { ServiceDot } from "@/components/primitives/service-chip";
import { TiltPoster } from "@/components/primitives/tilt-poster";
import { SERVICE_NAMES } from "@/domain/services";
import type { TitleView } from "@/domain/view";

/** A poster with the name and services under it. Tilts on hover and opens the title. Complete titles carry a check. */
export function PosterTile({ view }: { view: TitleView }) {
  const button = useRef<HTMLButtonElement>(null);
  const { openTitle } = useOverlays();
  const done = view.state?.status === "complete";
  return (
    <button ref={button} type="button" data-flip={`${view.id}|tile`} onClick={() => openTitle(view.ref, button.current)} className="relative block text-left">
      <TiltPoster>
        <Poster src={view.poster?.w342 ?? null} title={view.title} className="w-full">
          {done && (
            <span aria-hidden="true" className="absolute top-2 right-2 grid size-[26px] place-items-center rounded-full border border-border-strong bg-badge-bg text-brand-text">
              <Check className="size-[15px]" strokeWidth={2.4} />
            </span>
          )}
        </Poster>
        <div className="px-0.5 pt-2.5">
          <div className="line-clamp-2 text-sm leading-tight font-semibold tracking-[-0.01em]">{view.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[12.5px] text-faint">
            {(view.services ?? []).map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <ServiceDot service={s} />
                {SERVICE_NAMES[s]}
              </span>
            ))}
          </div>
        </div>
        <span className="sr-only">, open details</span>
      </TiltPoster>
    </button>
  );
}
