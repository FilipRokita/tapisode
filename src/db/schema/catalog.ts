import { sql } from "drizzle-orm";
import { boolean, check, date, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import type { Season } from "@/domain/types";

export const mediaType = pgEnum("media_type", ["tv", "movie"]);
export const seriesState = pgEnum("series_state", ["upcoming", "ongoing", "ended"]);

/** Keys only. Never purged, because a user's list points at these rows. */
export const mediaItems = pgTable(
  "media_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    provider: text("provider").notNull(),
    mediaType: mediaType("media_type").notNull(),
    externalId: text("external_id").notNull(),
    imdbId: text("imdb_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("media_items_provider_type_external_id").on(t.provider, t.mediaType, t.externalId)],
);

/** Everything that came from the provider. A cache: rows older than the purge age are deleted. */
export const mediaContent = pgTable(
  "media_content",
  {
    mediaItemId: uuid("media_item_id")
      .primaryKey()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    overview: text("overview").notNull().default(""),
    releaseDate: date("release_date", { mode: "string" }),
    posterPath: text("poster_path"),
    /** Minutes per episode for a series, minutes for a movie. */
    runtimeMinutes: integer("runtime_minutes"),
    /** Movies only. */
    movieReleased: boolean("movie_released"),
    /** Series only. */
    seriesState: seriesState("series_state"),
    seasons: jsonb("seasons").$type<Season[]>(),
    nextEpisode: jsonb("next_episode").$type<{ season: number; episode: number; airDate: string }>(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("media_content_fetched_at_idx").on(t.fetchedAt)],
);

/** Which of our services carry a title in a region. Its own lifetime, shorter than the content's. */
export const mediaAvailability = pgTable(
  "media_availability",
  {
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "cascade" }),
    region: text("region").notNull(),
    services: text("services").array().notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.mediaItemId, t.region] }), index("media_availability_fetched_at_idx").on(t.fetchedAt), check("media_availability_region_len", sql`char_length(${t.region}) = 2`)],
);
