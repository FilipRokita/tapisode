import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TryButton } from "./try-button";

/** The main call to action: the demo and sign-up for a guest, a way into the app for a member. With fillText the button is as wide as the hero text above it. Both sets are in the page, and CSS shows the one that fits the visitor. */
export function LandingActions({ className, fillText }: { className?: string; fillText?: boolean }) {
  return (
    <div className={className}>
      <div className={fillText ? "when-in w-full max-w-[30.5ch] text-lg" : "when-in"}>
        <Button asChild variant="primary" size="lg" className={fillText ? "w-full" : undefined}>
          <Link href="/app">Open the app</Link>
        </Button>
      </div>
      <TryButton className="when-out" />
      <Button asChild size="lg" className="when-out">
        <Link href="/signup">Create account</Link>
      </Button>
    </div>
  );
}
