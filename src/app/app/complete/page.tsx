import type { Metadata } from "next";
import { Suspense } from "react";
import { GridView } from "@/components/library/grid-view";

export const metadata: Metadata = { title: "Complete · Tapisode" };

export default function CompletePage() {
  return (
    <Suspense>
      <GridView status="complete" />
    </Suspense>
  );
}
