import { Skeleton } from "@/components/primitives/skeleton";
import type { BrowseLists } from "@/domain/view";
import { PosterRow } from "./poster-row";

/** What is trending, in cinemas and coming soon. A list that is empty is not shown. */
export function BrowseSections({ lists, firstK }: { lists: BrowseLists; firstK: number }) {
  return (
    <>
      <PosterRow id="trending" title="Trending this week" rows={lists.trending} ranked k={firstK} />
      <PosterRow id="in-cinemas" title="In cinemas now" rows={lists.inCinemas} k={firstK + 1} />
      <PosterRow id="coming-soon" title="Coming soon" rows={lists.comingSoon} dated k={firstK + 2} />
    </>
  );
}

/** Holds the place of the rows while the provider answers. */
export function BrowseSkeleton() {
  return (
    <div aria-hidden="true" className="mt-[26px] grid gap-3">
      <Skeleton className="h-4 w-40" />
      <div className="flex gap-3 md:grid md:grid-cols-6 md:gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[2/3] w-[132px] shrink-0 md:w-auto" />
        ))}
      </div>
    </div>
  );
}
