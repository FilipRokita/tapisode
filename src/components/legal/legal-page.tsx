import { Atmosphere } from "@/components/landing/atmosphere";
import { LandingFooter } from "@/components/landing/footer";
import { LandingNav } from "@/components/landing/nav";

/** The frame of a legal page: the landing's header and footer around a title with the date and plain text in a readable, centered column. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <Atmosphere violet={false} />
      <div className="relative mx-auto max-w-[1120px] px-5">
        <LandingNav />
        <main className="pt-6 pb-16 md:pt-10 md:pb-24">
          <article className="rise-in mx-auto max-w-[68ch] [&_h2]:mt-[26px] [&_h2]:mb-2 [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_li]:mb-2 [&_li]:text-[15px] [&_li]:text-dim [&_p]:mb-2 [&_p]:text-[15px] [&_p]:text-dim [&_ul]:list-disc [&_ul]:pl-5">
            <h1 className="mb-1.5 text-[30px] font-extrabold tracking-[-0.04em] md:text-[38px]">{title}</h1>
            <p className="!mb-3 !text-[13px] !text-faint">Last updated {updated}</p>
            {children}
          </article>
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}

export const LEGAL_UPDATED = "20 October 2026";
