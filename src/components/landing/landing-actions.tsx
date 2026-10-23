"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TryButton } from "./try-button";
import { useSignedIn } from "./use-signed-in";

/** The main call to action: the demo and sign-up for a guest, a way into the app for a signed-in visitor. With fillText the button is as wide as the hero text above it. */
export function LandingActions({ className, fillText }: { className?: string; fillText?: boolean }) {
  const signedIn = useSignedIn();
  return (
    <div className={className}>
      {signedIn ? (
        <div className={fillText ? "w-full max-w-[34ch] text-lg" : undefined}>
          <Button asChild variant="primary" size="lg" className={fillText ? "w-full" : undefined}>
            <Link href="/app/watching">Open the app</Link>
          </Button>
        </div>
      ) : (
        <>
          <TryButton />
          <Button asChild size="lg">
            <Link href="/signup">Create account</Link>
          </Button>
        </>
      )}
    </div>
  );
}
