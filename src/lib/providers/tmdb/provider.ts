import type { DateString } from "@/domain/countdown";
import { ProviderError, type BackdropSize, type BrowseHit, type BrowseList, type MediaProvider, type PosterSize, type ProviderTitle, type Region, type SearchHit, type SearchPage } from "@/domain/provider";
import type { RegionCode } from "@/domain/services";
import type { TitleRef } from "@/domain/types";
import type { RequestGate } from "../gate";
import { mapBrowse, mapMovie, mapSearch, mapTv } from "./mapper";

const API = "https://api.themoviedb.org/3";
const IMAGES = "https://image.tmdb.org/t/p/";

type Fetch = (url: string, init: RequestInit & { next?: { revalidate?: number } }) => Promise<Response>;

export interface TmdbOptions {
  readonly token: string;
  readonly gate: RequestGate;
  readonly fetch?: Fetch;
  readonly today?: () => DateString;
}

export class TmdbProvider implements MediaProvider {
  readonly id = "tmdb";
  private readonly doFetch: Fetch;
  private readonly today: () => DateString;

  constructor(private readonly options: TmdbOptions) {
    this.doFetch = options.fetch ?? ((url, init) => fetch(url, init));
    this.today = options.today ?? (() => new Date().toISOString().slice(0, 10));
  }

  /** Returns the parsed body, or null on 404. Throws ProviderError for everything else. */
  private async get(path: string, params: Record<string, string>, revalidate: number | null): Promise<unknown | null> {
    await this.options.gate.acquire();
    const url = new URL(API + path);
    url.searchParams.set("language", "en-US");
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    let res: Response;
    try {
      res = await this.doFetch(url.toString(), {
        headers: { Authorization: `Bearer ${this.options.token}`, accept: "application/json" },
        signal: AbortSignal.timeout(8000),
        // An explicit lifetime, so the host's data cache never keeps provider data longer than we decided.
        ...(revalidate === null ? { cache: "no-store" as const } : { next: { revalidate } }),
      });
    } catch {
      throw new ProviderError("unavailable", "The provider could not be reached");
    }
    if (res.status === 404) return null;
    if (res.status === 429) {
      const retry = Number(res.headers.get("retry-after")) || 30;
      await this.options.gate.pause(retry);
      throw new ProviderError("rate-limited", "The provider asked us to slow down", retry);
    }
    if (!res.ok) throw new ProviderError("unavailable", `The provider answered ${res.status}`);
    try {
      return await res.json();
    } catch {
      throw new ProviderError("invalid-response", "The provider sent something that is not JSON");
    }
  }

  async search(query: string, page: number): Promise<SearchPage> {
    const q = query.trim();
    if (!q) return { hits: [], page: 1, totalPages: 1 };
    const body = await this.get("/search/multi", { query: q, page: String(Math.min(Math.max(1, page), 500)), include_adult: "false" }, 60);
    return body === null ? { hits: [], page, totalPages: 1 } : mapSearch(body);
  }

  async popular(): Promise<readonly SearchHit[]> {
    const body = await this.get("/trending/all/week", {}, 3600);
    return body === null ? [] : mapSearch(body).hits;
  }

  async browse(list: BrowseList, region: RegionCode): Promise<readonly BrowseHit[]> {
    if (list === "trending") {
      const body = await this.get("/trending/all/week", {}, 3600);
      return body === null ? [] : mapBrowse(body, null);
    }
    const body = await this.get(list === "in-cinemas" ? "/movie/now_playing" : "/movie/upcoming", { region }, 3600);
    const hits = body === null ? [] : mapBrowse(body, "movie");
    if (list === "in-cinemas") return hits;
    const today = this.today();
    return hits.filter((h) => h.releaseDate !== null && h.releaseDate >= today).sort((a, b) => a.releaseDate!.localeCompare(b.releaseDate!));
  }

  async getTitle(ref: TitleRef, region: RegionCode): Promise<ProviderTitle | null> {
    if (!/^\d+$/.test(ref.externalId)) return null;
    const body = await this.get(`/${ref.type}/${ref.externalId}`, { append_to_response: "watch/providers,external_ids" }, null);
    if (body === null) return null;
    return ref.type === "tv" ? mapTv(body, region, this.today()) : mapMovie(body, region);
  }

  async regions(): Promise<readonly Region[]> {
    const body = (await this.get("/watch/providers/regions", {}, 86_400)) as { results?: { iso_3166_1: string; english_name: string }[] } | null;
    return (body?.results ?? []).map((r) => ({ code: r.iso_3166_1, name: r.english_name })).sort((a, b) => a.name.localeCompare(b.name));
  }

  imageUrl(path: string, size: PosterSize | BackdropSize): string {
    return `${IMAGES}${size}${path}`;
  }
}
