import { SpotlightCard } from "./spotlight-card";
import { Reveal } from "./reveal";
import { LandingActions } from "./landing-actions";

export function Closing() {
  return (
    <Reveal className="mt-6 mb-16">
      <SpotlightCard tilt={0.3} className="relative rounded-3xl border border-border bg-surface px-6 py-10 text-center hover:border-border-strong hover:shadow-[var(--shadow-lift)]">
        <div aria-hidden="true" className="l-glow-violet !top-[-120px] !left-1/2" />
        <h2 className="mx-auto max-w-[20ch] text-[clamp(28px,4vw,40px)] leading-[1.1] font-extrabold tracking-[-0.035em] [text-wrap:balance]">Ready when you are.</h2>
        <p className="mx-auto mt-3 mb-6 max-w-[52ch] text-dim">Take a look around with a ready-made list. No sign-up needed.</p>
        <LandingActions className="flex flex-wrap justify-center gap-3 max-md:[&>*]:w-full" />
      </SpotlightCard>
    </Reveal>
  );
}
