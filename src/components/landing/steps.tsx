import { Kbd } from "@/components/primitives/kbd";
import { Reveal } from "./reveal";

const STEPS = [
  { n: "01", title: "Add a title", text: (
      <>
        Press <Kbd>⌘K</Kbd> and search. Put it in Watching, Watchlist or Complete.
      </>
    ) },
  { n: "02", title: "Tap +1", text: "Every episode you finish is one tap. The ring fills as the season does." },
  { n: "03", title: "Know what is next", text: "See when the next episode airs and when you are all caught up." },
] as const;

export function Steps() {
  return (
    <section className="py-14">
      <Reveal>
        <h2 className="max-w-[20ch] text-[clamp(28px,4vw,40px)] leading-[1.1] font-extrabold tracking-[-0.035em] [text-wrap:balance]">How it works</h2>
      </Reveal>
      <div className="mt-8 grid gap-3.5 md:grid-cols-3 md:gap-7">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 90} className="flex items-start gap-4 border-t border-border py-[18px] md:flex-col md:gap-2.5">
            <b className="mono mt-[3px] text-sm text-brand-text">{s.n}</b>
            <div>
              <h3 className="text-[17px] font-bold tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-1 text-[14.5px] text-dim">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
