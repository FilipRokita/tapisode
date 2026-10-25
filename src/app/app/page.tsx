import type { Metadata } from "next";
import { Suspense } from "react";
import { loadBrowse, requirePageUser, type CurrentUser } from "@/actions/queries/library";
import { BrowseSections, BrowseSkeleton } from "@/components/home/browse-sections";
import { HomeView } from "@/components/home/home-view";

export const metadata: Metadata = { title: "Home · Tapisode" };

async function Rows({ user }: { user: CurrentUser }) {
  return <BrowseSections lists={await loadBrowse(user)} firstK={3} />;
}

export default async function HomePage() {
  const user = await requirePageUser();
  return (
    <HomeView
      name={user.isSandbox ? null : user.name}
      rows={
        <Suspense fallback={<BrowseSkeleton />}>
          <Rows user={user} />
        </Suspense>
      }
    />
  );
}
