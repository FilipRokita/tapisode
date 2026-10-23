"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TryButton } from "./try-button";
import { useSignedIn } from "./use-signed-in";

/** The main call to action: the demo and sign-up for a guest, a way into the app for a signed-in visitor. */
export function LandingActions({ className }: { className?: string }) {
  const signedIn = useSignedIn();
  return (
    <div className={className}>
      {signedIn ? (
        <Button asChild variant="primary" size="lg">
          <Link href="/app/watching">Open the app</Link>
        </Button>
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
