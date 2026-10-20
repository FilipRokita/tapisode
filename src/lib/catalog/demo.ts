import type { TitleView } from "@/domain/view";
import { FakeProvider } from "@/lib/providers/fake/provider";
import { factsFrom, posterUrls } from "./view";

/** The two titles on the landing's phone: one a tap from the end of its series, one caught up. Always the fake provider. */
const DEMO = [
  { id: "salt", position: { season: 1, episode: 7 } },
  { id: "kingdoms", position: { season: 3, episode: 7 } },
] as const;

/** Plain data for the landing demo, built without a database. The page passes it to a client component. */
export async function demoTitles(): Promise<TitleView[]> {
  const provider = new FakeProvider();
  const views = await Promise.all(
    DEMO.map(async ({ id, position }): Promise<TitleView | null> => {
      const t = await provider.getTitle({ provider: "fake", type: "tv", externalId: id }, "PL");
      if (!t?.series) return null;
      return {
        id: `demo-${id}`,
        ref: t.ref,
        title: t.title,
        overview: t.overview,
        year: t.releaseDate ? Number(t.releaseDate.slice(0, 4)) : null,
        poster: posterUrls(t.posterPath, (p, s) => provider.imageUrl(p, s)),
        runtimeMinutes: t.runtimeMinutes,
        facts: factsFrom(t),
        nextEpisode: t.series.nextEpisode,
        services: t.availability,
        state: { status: "watching", position },
        activityAt: 0,
      };
    }),
  );
  return views.filter((v): v is TitleView => v !== null);
}
