"use client";

import Link from "next/link";
import { useSignedIn } from "./use-signed-in";

export function FooterAccountLink() {
  const signedIn = useSignedIn();
  return signedIn ? (
    <Link href="/app/watching" className="hover:text-foreground">
      Open the app
    </Link>
  ) : (
    <Link href="/signin" className="hover:text-foreground">
      Sign in
    </Link>
  );
}
