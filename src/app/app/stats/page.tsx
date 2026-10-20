import type { Metadata } from "next";
import { loadStats, requirePageUser } from "@/actions/queries/library";
import { StatsView } from "@/components/stats/stats-view";

export const metadata: Metadata = { title: "Stats · Tapisode" };

export default async function StatsPage() {
  const user = await requirePageUser();
  return <StatsView stats={await loadStats(user)} />;
}
