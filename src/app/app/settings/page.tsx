import type { Metadata } from "next";
import { loadRegions, regionOf, requirePageUser } from "@/actions/queries/library";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings · Tapisode" };

export default async function SettingsPage() {
  const user = await requirePageUser();
  const regions = await loadRegions();
  return <SettingsView isSandbox={user.isSandbox} country={regionOf(user)} regions={regions} />;
}
