import "server-only";
import { trackedStates } from "@/db/library";
import type { SearchHit } from "@/domain/provider";
import type { SearchRow } from "@/domain/view";
import { guardSearch } from "@/lib/limits/guards";
import { getProvider } from "@/lib/providers";

const key = (r: SearchHit["ref"]) => `${r.provider}:${r.type}:${r.externalId}`;

async function toRows(userId: string, hits: readonly SearchHit[]): Promise<SearchRow[]> {
  const provider = getProvider();
  const tracked = await trackedStates(userId, hits.map((h) => h.ref));
  return hits.map((h) => ({ ref: h.ref, title: h.title, year: h.year, poster: h.posterPath ? { w92: provider.imageUrl(h.posterPath, "w92") } : null, state: tracked.get(key(h.ref)) ?? null }));
}

export async function searchTitles(userId: string, ip: string, query: string, page: number) {
  await guardSearch(userId, ip);
  const result = await getProvider().search(query, page);
  return { rows: await toRows(userId, result.hits), page: result.page, totalPages: result.totalPages };
}

/** "Popular right now": what the provider lists, minus anything already on the user's lists. */
export async function popularTitles(userId: string, ip: string): Promise<SearchRow[]> {
  await guardSearch(userId, ip);
  const rows = await toRows(userId, await getProvider().popular());
  return rows.filter((r) => r.state === null).slice(0, 8);
}
