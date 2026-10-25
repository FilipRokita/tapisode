import type { LucideIcon } from "lucide-react";
import { cn } from "cn";
import { Layers, Tv, Zap } from "@/components/primitives/icons";
import { SpotlightCard } from "./spotlight-card";
import { Reveal } from "./reveal";

const FEATURES: readonly { icon: LucideIcon; title: string; text: string; accent?: boolean }[] = [
  { icon: Zap, title: "One-tap progress", text: "Advance an episode instantly, roll over to the next season, and undo a mistake in one tap.", accent: true },
  { icon: Tv, title: "See where it streams", text: "Pick your country and filter your list by the services that carry each title there." },
  { icon: Layers, title: "Three states, no clutter", text: "Watching, Watchlist, Complete. No ratings and no social feed. Home shows what airs this week." },
];

export function Features() {
  return (
    <section className="relative isolate py-14">
      <div aria-hidden="true" className="l-glow-mid" />
      <Reveal>
        <h2 className="max-w-[20ch] text-[clamp(28px,4vw,40px)] leading-[1.1] font-extrabold tracking-[-0.035em] [text-wrap:balance]">Everything you need. Nothing you do not.</h2>
      </Reveal>
      <Reveal>
        <p className="mt-3 max-w-[52ch] text-dim">Built phone-first and fast, and it feels just as good on a big screen.</p>
      </Reveal>
      <div className="mt-8 grid gap-[18px] md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 90}>
            <SpotlightCard className="h-full rounded-2xl border border-border bg-surface p-[22px] hover:border-border-strong hover:shadow-[var(--shadow-lift)]">
              <div className={cn("grid size-10 place-items-center rounded-[12px]", f.accent ? "bg-brand-soft text-brand-text" : "bg-surface-3 text-foreground")}>
                <f.icon className="size-5" />
              </div>
              <h3 className="mt-3.5 mb-1.5 text-[17px] tracking-[-0.02em] font-bold">{f.title}</h3>
              <p className="text-[14.5px] text-dim">{f.text}</p>
            </SpotlightCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
