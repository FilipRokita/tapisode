import type { ReactNode } from "react";

/** The heading of a section of Home: a short accent bar, the title in large type, a hairline that fades out, and an optional note at the end. `rule` is off where a line of its own sits right below. */
export function SectionHeading({ id, children, aside, rule = true }: { id: string; children: ReactNode; aside?: ReactNode; rule?: boolean }) {
  return (
    <div className="mb-5 flex items-center gap-3.5">
      <i aria-hidden="true" className="block h-6 w-1 shrink-0 rounded-full bg-[linear-gradient(to_bottom,var(--brand-text),var(--brand))]" />
      <h2 id={id} className="text-[22px] leading-none font-extrabold tracking-[-0.035em] whitespace-nowrap md:text-[26px]">
        {children}
      </h2>
      <i aria-hidden="true" className={rule ? "h-px flex-1 bg-[linear-gradient(90deg,var(--home-line),transparent)]" : "flex-1"} />
      {aside && <span className="text-[13px] whitespace-nowrap text-dim">{aside}</span>}
    </div>
  );
}
