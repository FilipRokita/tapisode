import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = { title: "Stats · Tapisode" };

export default function Page() {
  return <PageHeader title="Stats" sub="Your viewing at a glance" />;
}
