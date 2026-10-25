import "server-only";
import { trackedStates } from "@/db/library";
import type { BrowseHit, BrowseList } from "@/domain/provider";
import type { RegionCode } from "@/domain/services";
import type { BrowseLists, BrowseRow } from "@/domain/view";
import { getProvider } from "@/lib/providers";

const PER_LIST = 10;

/** The lists of Home. A list the provider cannot give right now comes back empty, so the others still show. */
export async function browseLists(userId: string, region: RegionCode): Promise<BrowseLists> {
  const provider = getProvider();
  const names = ["trending", "in-cinemas", "coming-soon"] as const satisfies readonly BrowseList[];
  const settled = await Promise.allSettled(names.map((list) => provider.browse(list, region)));
  const hits = settled.map((r): readonly BrowseHit[] => (r.status === "fulfilled" ? r.value : []));
  const tracked = await trackedStates(userId, hits.flat().map((h) => h.ref));
  const rows = (list: readonly BrowseHit[]): BrowseRow[] =>
    list
      .filter((h) => !tracked.has(`${h.ref.provider}:${h.ref.type}:${h.ref.externalId}`))
      .slice(0, PER_LIST)
      .map((h) => ({ ref: h.ref, title: h.title, year: h.year, poster: h.posterPath ? { w185: provider.imageUrl(h.posterPath, "w185") } : null, backdrop: h.backdropPath ? provider.imageUrl(h.backdropPath, "w780") : null, releaseDate: h.releaseDate }));
  return { trending: rows(hits[0]!), inCinemas: rows(hits[1]!), comingSoon: rows(hits[2]!) };
}
