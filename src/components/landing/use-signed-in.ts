"use client";

import { useEffect, useState } from "react";

let request: Promise<boolean> | undefined;

/** One plain request per page load, shared by every part of the landing that depends on it, so the page itself stays static and the auth client's code is not part of it. */
function fetchSignedIn(): Promise<boolean> {
  request ??= fetch("/api/auth/get-session")
    .then((res) => (res.ok ? res.json() : null))
    .then((body: { session?: unknown } | null) => Boolean(body?.session))
    .catch(() => false);
  return request;
}

/** False until the answer arrives, so a signed-in visitor sees the guest links for a moment. */
export function useSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    void fetchSignedIn().then(setSignedIn);
  }, []);
  return signedIn;
}
