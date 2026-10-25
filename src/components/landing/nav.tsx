import Link from "next/link";
import { Logo } from "@/components/primitives/logo";
import { Button } from "@/components/ui/button";
import { SessionProbe } from "./session-probe";

const compact = "max-[480px]:min-h-10 max-[480px]:px-3 max-[480px]:text-sm";

/** The logo and the account links. Both sets are in the page and CSS shows the one that fits the visitor (see session-hint.ts), so the page stays static and does not flash. */
export function LandingNav() {
  return (
    <header className="flex items-center justify-between pt-[calc(18px+var(--safe-top))] pb-[18px]">
      <SessionProbe />
      <Link href="/" aria-label="Tapisode home">
        <Logo className="max-[340px]:[&_b]:hidden max-[360px]:gap-1.5 max-[360px]:text-[15px] max-[480px]:text-[17px] [&_svg]:max-[480px]:size-[26px] [&_svg]:max-[360px]:size-[22px]" />
      </Link>
      <nav aria-label="Account" className="flex items-center gap-1.5 max-[480px]:gap-0.5">
        <Button asChild variant="secondary" className={`when-in ${compact}`}>
          <Link href="/app">Open the app</Link>
        </Button>
        <Button asChild variant="ghost" className={`when-out ${compact} max-[360px]:px-[9px] max-[360px]:text-[13px]`}>
          <Link href="/signin">Sign in</Link>
        </Button>
        <Button asChild variant="secondary" className={`when-out ${compact} max-[360px]:px-[9px] max-[360px]:text-[13px]`}>
          <Link href="/signup">Create account</Link>
        </Button>
      </nav>
    </header>
  );
}
