"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/components/copy";
import { useLibrary } from "@/components/library/library-provider";
import type { TitleRef } from "@/domain/types";
import type { TitleView } from "@/domain/view";
import { refToParam, sameRef } from "./title-ref";

export type DrawerTitle = { readonly status: "loading" } | { readonly status: "error"; readonly message: string } | { readonly status: "ready"; readonly view: TitleView };

type Fetched = { readonly key: string; readonly result: Exclude<DrawerTitle, { status: "loading" }> };

const KNOWN = ["NOT_FOUND", "RATE_LIMITED", "BUSY", "UNAVAILABLE", "UNAUTHORIZED", "INVALID_INPUT"] as const;

/**
 * The title the drawer shows. A title on the user's lists comes live from the library, so every change shows at once.
 * Any other title is fetched once from `/api/title`.
 */
export function useDrawerTitle(ref: TitleRef | null): DrawerTitle {
  const { titles } = useLibrary();
  const [fetched, setFetched] = useState<Fetched | null>(null);
  // The last view seen on the lists. When the title leaves them (an undone add), the sheet keeps showing it with no state.
  const [seen, setSeen] = useState<{ readonly key: string; readonly view: TitleView } | null>(null);
  const tracked = ref ? titles.find((t) => sameRef(t.ref, ref)) : undefined;
  const key = ref ? refToParam(ref) : null;
  if (tracked && key && (seen?.key !== key || seen.view !== tracked)) setSeen({ key, view: tracked });
  const wasTracked = seen !== null && seen.key === key;

  useEffect(() => {
    if (!ref || !key || tracked || wasTracked) return;
    const controller = new AbortController();
    const query = new URLSearchParams({ provider: ref.provider, type: ref.type, id: ref.externalId });
    fetch(`/api/title?${query}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.ok) return { key, result: { status: "ready", view: (await res.json()) as TitleView } } satisfies Fetched;
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        const code = KNOWN.find((k) => k === body?.error) ?? "UNAVAILABLE";
        return { key, result: { status: "error", message: errorMessage(code) } } satisfies Fetched;
      })
      .catch((error: unknown) => (error instanceof DOMException && error.name === "AbortError" ? null : ({ key, result: { status: "error", message: errorMessage("UNAVAILABLE") } } satisfies Fetched)))
      .then((next) => {
        if (next) setFetched(next);
      });
    return () => controller.abort();
  }, [ref, key, tracked, wasTracked]);

  if (tracked) return { status: "ready", view: tracked };
  if (seen && seen.key === key) return { status: "ready", view: { ...seen.view, state: null } };
  if (fetched && fetched.key === key) return fetched.result;
  return { status: "loading" };
}
