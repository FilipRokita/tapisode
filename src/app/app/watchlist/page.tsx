import type { Metadata } from "next";
import { Suspense } from "react";
import { GridView } from "@/components/library/grid-view";

export const metadata: Metadata = { title: "Watchlist · Tapisode" };

export default function WatchlistPage() {
  return (
    <Suspense>
      <GridView status="watchlist" />
    </Suspense>
  );
}
