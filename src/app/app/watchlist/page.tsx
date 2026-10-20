import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = { title: "Watchlist · Tapisode" };

export default function Page() {
  return <PageHeader title="Watchlist" sub="Titles waiting for you" />;
}
