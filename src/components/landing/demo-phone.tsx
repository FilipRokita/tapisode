"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { launchConfetti } from "@/components/confetti";
import { LogoMark } from "@/components/primitives/logo";
import { ArrowLeft } from "@/components/primitives/icons";
import { TiltBox } from "@/components/primitives/tilt-box";
import { TitleCard } from "@/components/library/title-card";
import { isFinished } from "@/domain/progress";
import { transition } from "@/domain/transitions";
import type { UserTitleState } from "@/domain/types";
import type { TitleView } from "@/domain/view";

interface Slot {
  /** The state the card is really in. */
  readonly state: UserTitleState;
  /** The state it shows for a moment before it counts, so the number rolls and the bar fills first. */
  readonly preview?: UserTitleState;
  /** Changes when the title is dealt again, so it fades in as a new card. */
  readonly deal: number;
}

const FINISH_DELAY = 450;
const REDEAL_DELAY = 4200;

/**
 * The phone on the landing. It uses the same card as the app and the same `transition` function, on copies of two titles,
 * so tapping it never touches real data. The first title is one tap from its end, so the visitor gets the confetti, which stays inside the phone.
 */
export function DemoPhone({ titles }: { titles: readonly TitleView[] }) {
  const [slots, setSlots] = useState<Readonly<Record<string, Slot>>>(() => Object.fromEntries(titles.map((t) => [t.id, { state: t.state!, deal: 0 }])));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stopConfetti = useRef<() => void>(() => {});
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      stopConfetti.current();
    },
    [],
  );

  const plus = useCallback(
    (view: TitleView) => {
      const slot = slots[view.id];
      if (!slot || slot.preview) return;
      const result = transition(view.facts, slot.state, { kind: "plusOne" });
      if (!result.ok || !result.value) return;
      const next = result.value;
      if ("vibrate" in navigator) navigator.vibrate(12);
      const finishing = view.facts.type === "tv" && isFinished(view.facts, next.position);
      setSlots((s) => ({ ...s, [view.id]: { ...slot, preview: next } }));
      timers.current.push(
        setTimeout(() => {
          setSlots((s) => ({ ...s, [view.id]: { ...slot, state: next } }));
          if (!finishing) return;
          if (canvas.current) {
            stopConfetti.current();
            stopConfetti.current = launchConfetti(canvas.current);
          }
          timers.current.push(setTimeout(() => setSlots((s) => ({ ...s, [view.id]: { state: view.state!, deal: slot.deal + 1 } })), REDEAL_DELAY));
        }, finishing ? FINISH_DELAY : 0),
      );
    },
    [slots],
  );

  return (
    <div className="relative flex justify-center">
      <div className="relative w-[306px] max-w-full rounded-[40px] border border-border-strong bg-background px-[15px] pt-3.5 pb-4 shadow-[0_0_0_7px_var(--bezel),0_40px_90px_rgb(0_0_0/0.65)]">
        <div aria-hidden="true" className="relative z-10 mx-auto mb-3 h-[22px] w-[90px] rounded-xl border border-border bg-black" />
        <div className="flex items-center justify-between px-1.5 pt-0.5 pb-2.5">
          <span className="inline-flex items-center gap-2 text-[15px] font-bold tracking-[-0.03em]">
            <LogoMark size={22} />
            <b className="font-bold">
              Tap<span className="font-medium text-dim">isode</span>
            </b>
          </span>
          <span className="eyebrow">Watching</span>
        </div>
        <div className="grid gap-2.5">
          {titles.map((view) => {
            const slot = slots[view.id]!;
            const shown: TitleView = { ...view, state: slot.state };
            return (
              <TiltBox key={`${view.id}-${slot.deal}`} className={slot.deal > 0 ? "rise-in" : undefined}>
                <TitleCard view={shown} preview={slot.preview} compact onPlus={() => plus(shown)} onMarkWatched={() => {}} />
              </TiltBox>
            );
          })}
        </div>
        <canvas ref={canvas} id="demo-confetti" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full rounded-[40px]" />
      </div>
      <div aria-hidden="true" className="absolute top-32 -right-1.5 hidden translate-x-full items-center gap-2 text-[13px] text-dim md:flex">
        <ArrowLeft className="size-[34px]" />
        <span>Go on, tap it</span>
      </div>
    </div>
  );
}
