import type { DateString } from "@/domain/countdown";
import type { MediaProvider, PosterSize, ProviderTitle, Region, SearchHit, SearchPage } from "@/domain/provider";
import type { RegionCode } from "@/domain/services";
import type { TitleRef } from "@/domain/types";
import { FAKE_POPULAR, FAKE_REGIONS, FAKE_TITLES, type FakeTitle } from "./data";
import { fakePosterPath, fakePosterUrl } from "./poster";

const PAGE_SIZE = 20;

const addDays = (today: DateString, days: number): DateString => {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days)).toISOString().slice(0, 10);
};

const hitOf = (t: FakeTitle): SearchHit => ({
  ref: { provider: "fake", type: t.type, externalId: t.id },
  title: t.title,
  year: t.year,
  posterPath: fakePosterPath(t.hue, t.id),
});

/** A provider with invented data. It powers tests, the landing demo, screenshots and development without a key. */
export class FakeProvider implements MediaProvider {
  readonly id = "fake";

  constructor(private readonly today: () => DateString = () => new Date().toISOString().slice(0, 10)) {}

  async search(query: string, page: number): Promise<SearchPage> {
    const q = query.trim().toLowerCase();
    const all = q ? FAKE_TITLES.filter((t) => t.title.toLowerCase().includes(q)).map(hitOf) : [];
    const totalPages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
    return { hits: all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, totalPages };
  }

  async popular(): Promise<readonly SearchHit[]> {
    return FAKE_POPULAR.flatMap((id) => FAKE_TITLES.filter((t) => t.id === id).map(hitOf));
  }

  async getTitle(ref: TitleRef, region: RegionCode): Promise<ProviderTitle | null> {
    const t = FAKE_TITLES.find((x) => x.id === ref.externalId && x.type === ref.type);
    if (!t) return null;
    const today = this.today();
    const series = t.series;
    const seasons = series ? series.counts.map((count, i) => ({ number: i + 1, episodeCount: count, airedCount: series.aired[i] ?? 0 })) : [];
    const lastSeason = seasons.filter((s) => s.airedCount > 0).at(-1);
    return {
      ref: { provider: "fake", type: t.type, externalId: t.id },
      imdbId: null,
      title: t.title,
      overview: t.overview,
      releaseDate: `${t.year}-01-01`,
      posterPath: fakePosterPath(t.hue, t.id),
      runtimeMinutes: t.runtimeMinutes > 0 ? t.runtimeMinutes : null,
      released: t.type === "movie" ? t.released === true : seasons.some((s) => s.airedCount > 0),
      series: series
        ? {
            state: series.state,
            seasons,
            nextEpisode: series.nextInDays && lastSeason ? { season: lastSeason.number, episode: lastSeason.airedCount + 1, airDate: addDays(today, series.nextInDays) } : null,
          }
        : null,
      // Every region sees the same services, except that a region the fake data does not list sees none.
      availability: FAKE_REGIONS.some((r) => r.code === region) ? t.services : [],
    };
  }

  async regions(): Promise<readonly Region[]> {
    return FAKE_REGIONS;
  }

  imageUrl(path: string, _size: PosterSize): string {
    return fakePosterUrl(path);
  }
}
