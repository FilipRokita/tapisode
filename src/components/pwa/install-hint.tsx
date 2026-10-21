"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { X } from "@/components/primitives/icons";

const KEY = "tapisode:install-hint-dismissed";

/** True on Safari for iPhone and iPad when the app is not installed. Chrome and Firefox on iOS cannot add to the home screen. */
function shouldHint(): boolean {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (!ios || !safari || standalone) return false;
  try {
    return localStorage.getItem(KEY) !== "1";
  } catch {
    return true;
  }
}

const noSubscribe = () => () => {};

/** A one-time banner on iOS Safari that says how to add Tapisode to the home screen. The dismissal is remembered. */
export function InstallHint() {
  const wanted = useSyncExternalStore(noSubscribe, shouldHint, () => false);
  const [dismissed, setDismissed] = useState(false);
  if (!wanted || dismissed) return null;
  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Private mode: the banner simply comes back next time.
    }
  };
  return (
    <div role="status" className="mb-2.5 flex items-center justify-between gap-2.5 rounded-[14px] border border-border bg-surface-2 py-2 pr-1.5 pl-3.5 text-[13.5px] text-dim">
      <span>Install Tapisode: tap Share, then Add to Home Screen.</span>
      <Button variant="ghost" size="icon" aria-label="Dismiss" onClick={dismiss}>
        <X />
      </Button>
    </div>
  );
}
