import type { TitleView } from "@/domain/view";
import { DemoPhone } from "./demo-phone";
import { LandingActions } from "./landing-actions";

export function Hero({ demo }: { demo: readonly TitleView[] }) {
  return (
    <section className="grid items-center gap-10 pt-12 pb-16 md:grid-cols-[1.1fr_.9fr] md:pt-[72px] md:pb-[88px] [&>*]:min-w-0">
      <div className="rise-in">
        <span className="rounded-full bg-brand-soft px-2.5 py-[3px] text-xs font-semibold text-brand-text">Movies &amp; shows, minus the noise</span>
        <h1 className="mt-[18px] text-[clamp(36px,5.4vw,62px)] leading-[1.02] font-extrabold tracking-[-0.045em] [text-wrap:balance]">
          Know where you are.
          <br />
          <em className="not-italic text-dim">One tap at a time.</em>
        </h1>
        <p className="mt-[18px] max-w-[30.5ch] text-lg text-dim">Tapisode tracks what you are watching, which episode you are on and where to stream it. Nothing else.</p>
        <LandingActions fillText className="mt-7 flex flex-wrap gap-3 max-md:[&>*]:w-full" />
        <p className="mt-4 text-[13px] text-faint">Free, no ads. Open it whenever you feel like watching.</p>
      </div>
      <div className="rise-in [animation-delay:.1s]">
        <DemoPhone titles={demo} />
      </div>
    </section>
  );
}
