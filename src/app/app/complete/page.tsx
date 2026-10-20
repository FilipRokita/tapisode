import type { Metadata } from "next";
import { PageHeader } from "@/components/app-shell/page-header";

export const metadata: Metadata = { title: "Complete · Tapisode" };

export default function Page() {
  return <PageHeader title="Complete" sub="Finished titles" />;
}
