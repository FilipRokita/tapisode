"use client";

import { useEffect } from "react";
import { setSessionHint } from "./session-hint";

/** Asks once whether the visitor is signed in and corrects the hint if it was wrong. A plain request, so the auth client's code stays out of the page. */
export function SessionProbe() {
  useEffect(() => {
    fetch("/api/auth/get-session")
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { session?: unknown } | null) => setSessionHint(Boolean(body?.session)))
      .catch(() => {});
  }, []);
  return null;
}

/** Sets the hint where the visitor is known to be signed in, so the landing is right the next time they open it. */
export function SessionMark() {
  useEffect(() => setSessionHint(true), []);
  return null;
}
