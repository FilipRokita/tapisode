import type { ReactNode } from "react";

/** The heading of a section of Home: small caps, a hairline that fades out, and an optional note at the end. */
export function SectionHeading({ id, children, aside }: { id: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-4">
      <h2 id={id} className="text-[13px] font-semibold tracking-[0.1em] whitespace-nowrap text-text-soft uppercase">
        {children}
      </h2>
      <i aria-hidden="true" className="h-px flex-1 bg-[linear-gradient(90deg,var(--home-line),transparent)]" />
      {aside && <span className="text-[12.5px] whitespace-nowrap text-faint">{aside}</span>}
    </div>
  );
}
