"use client";

import Link from "next/link";
import { authClient } from "@/components/auth/auth-client";
import { Logo } from "@/components/primitives/logo";
import { Button } from "@/components/ui/button";

/** The logo and the account links. Signed-in visitors are recognized after the page loads, so the page itself stays static. */
export function LandingNav() {
  const { data: session } = authClient.useSession();
  return (
    <header className="flex items-center justify-between pt-[calc(18px+var(--safe-top))] pb-[18px]">
      <Link href="/" aria-label="Tapisode home">
        <Logo className="max-[340px]:[&_b]:hidden max-[360px]:gap-1.5 max-[360px]:text-[15px] max-[480px]:text-[17px] [&_svg]:max-[480px]:size-[26px] [&_svg]:max-[360px]:size-[22px]" />
      </Link>
      <nav aria-label="Account" className="flex items-center gap-1.5 max-[480px]:gap-0.5">
        {session ? (
          <Button asChild variant="secondary" className="max-[480px]:min-h-10 max-[480px]:px-3 max-[480px]:text-sm">
            <Link href="/app/watching">Open the app</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="ghost" className="max-[480px]:min-h-10 max-[480px]:px-3 max-[480px]:text-sm max-[360px]:px-[9px] max-[360px]:text-[13px]">
              <Link href="/signin">Sign in</Link>
            </Button>
            <Button asChild variant="secondary" className="max-[480px]:min-h-10 max-[480px]:px-3 max-[480px]:text-sm max-[360px]:px-[9px] max-[360px]:text-[13px]">
              <Link href="/signup">Create account</Link>
            </Button>
          </>
        )}
      </nav>
    </header>
  );
}
