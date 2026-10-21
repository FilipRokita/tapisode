"use client";

import { useEffect } from "react";

/** Registers the offline fallback worker. Not in development, where a worker only gets in the way. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);
  return null;
}
