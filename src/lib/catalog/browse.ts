import "server-only";
import type { BrowseHit, BrowseList } from "@/domain/provider";
import type { RegionCode } from "@/domain/services";
import type { BrowseLists, BrowseRow } from "@/domain/view";
import { getProvider } from "@/lib/providers";

/** How many titles each list keeps. Trending is a long row you scroll through, the others are a short pick. */
const PER_LIST = { trending: 15, inCinemas: 10, comingSoon: 10 } as const;

/** The lists of Home. A list the provider cannot give right now comes back empty, so the others still show. */
export async function browseLists(region: RegionCode): Promise<BrowseLists> {
  const provider = getProvider();
  const names = ["trending", "in-cinemas", "coming-soon"] as const satisfies readonly BrowseList[];
  const settled = await Promise.allSettled(names.map((list) => provider.browse(list, region)));
  const hits = settled.map((r): readonly BrowseHit[] => (r.status === "fulfilled" ? r.value : []));
  const rows = (list: readonly BrowseHit[], limit: number): BrowseRow[] =>
    list
      .slice(0, limit)
      .map((h) => ({ ref: h.ref, title: h.title, year: h.year, poster: h.posterPath ? { w185: provider.imageUrl(h.posterPath, "w185") } : null, backdrop: h.backdropPath ? provider.imageUrl(h.backdropPath, "w780") : null, releaseDate: h.releaseDate }));
  return { trending: rows(hits[0]!, PER_LIST.trending), inCinemas: rows(hits[1]!, PER_LIST.inCinemas), comingSoon: rows(hits[2]!, PER_LIST.comingSoon) };
}
