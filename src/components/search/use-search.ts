"use client";

import { useEffect, useState } from "react";
import type { SearchRow } from "@/domain/view";

export type SearchState =
  | { readonly status: "loading"; readonly rows: readonly SearchRow[] }
  | { readonly status: "ready"; readonly rows: readonly SearchRow[]; readonly popular: boolean }
  | { readonly status: "error"; readonly rows: readonly SearchRow[]; readonly message: string };

export const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

const messageFor = (status: number): string => (status === 429 ? "Too many searches. Try again in a minute." : "Search is unavailable right now.");

/**
 * What the palette shows. With no query (or fewer than two characters) it is the popular list, fetched once per open.
 * Typing waits 250ms, and a newer request cancels the one before it.
 */
export function useSearch(open: boolean, query: string): SearchState {
  const [state, setState] = useState<SearchState>({ status: "loading", rows: [] });
  const text = query.trim();
  const searching = text.length >= MIN_QUERY;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const url = searching ? `/api/search?${new URLSearchParams({ q: text })}` : "/api/popular";
    const timer = setTimeout(
      () => {
        fetch(url, { signal: controller.signal })
          .then(async (res) => {
            if (!res.ok) return { status: "error", rows: [], message: messageFor(res.status) } as const;
            const body = (await res.json()) as { rows: SearchRow[] };
            return { status: "ready", rows: body.rows, popular: !searching } as const;
          })
          .catch((error: unknown) => (error instanceof DOMException && error.name === "AbortError" ? null : ({ status: "error", rows: [], message: messageFor(503) } as const)))
          .then((next) => {
            if (next) setState(next);
          });
      },
      searching ? DEBOUNCE_MS : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, searching, text]);

  return state;
}
