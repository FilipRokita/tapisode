import Link from "next/link";
import { ArrowLeft } from "@/components/primitives/icons";
import { Button } from "@/components/ui/button";

/** The frame of a legal page: a back link, a title with the date, and plain text in a readable column. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[1120px] px-5 pt-[calc(20px+var(--safe-top))] pb-20">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/">
          <ArrowLeft />
          Back
        </Link>
      </Button>
      <article className="rise-in mt-[18px] max-w-[68ch] [&_h2]:mt-[26px] [&_h2]:mb-2 [&_h2]:text-[17px] [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_li]:mb-2 [&_li]:text-[15px] [&_li]:text-dim [&_p]:mb-2 [&_p]:text-[15px] [&_p]:text-dim [&_ul]:list-disc [&_ul]:pl-5">
        <h1 className="mb-1.5 text-[30px] font-extrabold tracking-[-0.04em]">{title}</h1>
        <p className="!mb-3 !text-[13px] !text-faint">Last updated {updated}</p>
        {children}
      </article>
    </main>
  );
}

export const LEGAL_UPDATED = "20 October 2026";
export const CONTACT = "contact@filiprokita.com";
