import type { Metadata } from "next";
import { WatchingView } from "@/components/library/watching-view";

export const metadata: Metadata = { title: "Watching · Tapisode" };

export default function WatchingPage() {
  return <WatchingView />;
}
