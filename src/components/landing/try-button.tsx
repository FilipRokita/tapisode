"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/components/auth/auth-client";
import { Button } from "@/components/ui/button";

/** "Try it without an account": opens a demo session and goes straight to the app. */
export function TryButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [full, setFull] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setFull(null);
    const { error } = await authClient.signIn.anonymous();
    if (error) {
      setBusy(false);
      setFull(error.status === 429 ? "Too many attempts. Wait a moment." : "The demo is full right now. Try again later, or create an account.");
      return;
    }
    router.push("/app/watching");
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" size="lg" className={className} onClick={go} disabled={busy}>
        {busy ? "Opening the demo…" : "Try it without an account"}
      </Button>
      {full && (
        <p role="alert" className="basis-full text-[13px] text-danger">
          {full}{" "}
          <Link href="/signup" className="underline">
            Create an account
          </Link>
        </p>
      )}
    </>
  );
}
