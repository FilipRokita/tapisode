import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = { title: "Watching · Tapisode" };

export default function Page() {
  return <PageHeader title="Watching" sub="Nothing in progress yet." />;
}
