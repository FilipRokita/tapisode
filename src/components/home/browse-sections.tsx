import { Skeleton } from "@/components/primitives/skeleton";
import { Reveal } from "@/components/landing/reveal";
import type { BrowseLists } from "@/domain/view";
import { PosterRow } from "./poster-row";

/** What is trending, in cinemas and coming soon. A list that is empty is not shown. */
export function BrowseSections({ lists }: { lists: BrowseLists }) {
  return (
    <>
      <Reveal>
        <PosterRow id="trending" title="Trending this week" rows={lists.trending} ranked />
      </Reveal>
      <Reveal>
        <PosterRow id="in-cinemas" title="In cinemas now" rows={lists.inCinemas} />
      </Reveal>
      <Reveal>
        <PosterRow id="coming-soon" title="Coming soon" rows={lists.comingSoon} dated />
      </Reveal>
    </>
  );
}

/** Holds the place of the rows while the provider answers. */
export function BrowseSkeleton() {
  return (
    <div aria-hidden="true" className="mt-10 grid gap-4 md:mt-12">
      <Skeleton className="h-4 w-44" />
      <div className="flex gap-3 md:grid md:grid-cols-6 md:gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="aspect-[2/3] w-[140px] shrink-0 md:w-auto" />
        ))}
      </div>
    </div>
  );
}
