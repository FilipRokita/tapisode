import Link from "next/link";
import { TmdbAttribution } from "@/components/legal/tmdb-attribution";
import { FooterAccountLink } from "./footer-account-link";
import { Reveal } from "./reveal";

export function LandingFooter() {
  return (
    <Reveal>
      <footer className="grid gap-[18px] border-t border-border pt-7 pb-[calc(40px+var(--safe-bottom))] text-[13px] text-faint md:grid-cols-[1fr_auto] md:items-start">
        <TmdbAttribution />
        <nav aria-label="Legal" className="flex flex-wrap gap-4">
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <FooterAccountLink />
        </nav>
      </footer>
    </Reveal>
  );
}
