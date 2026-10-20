import { sql } from "drizzle-orm";
import { check, index, integer, pgEnum, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { STATUSES } from "@/domain/types";
import { user } from "./auth";
import { mediaItems } from "./catalog";

export const userMediaStatus = pgEnum("user_media_status", STATUSES);

/** One row per user and title: the state the user recorded. Never purged with catalog content. */
export const userMedia = pgTable(
  "user_media",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    mediaItemId: uuid("media_item_id")
      .notNull()
      .references(() => mediaItems.id, { onDelete: "restrict" }),
    status: userMediaStatus("status").notNull(),
    /** The last watched episode. Season 0 and episode 0 mean not started, and movies are always there. */
    season: integer("season").notNull().default(0),
    episode: integer("episode").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    /** The last time the user did anything to this row. Orders the Watching list. */
    activityAt: timestamp("activity_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("user_media_user_item").on(t.userId, t.mediaItemId),
    index("user_media_list_idx").on(t.userId, t.status, t.activityAt.desc()),
    index("user_media_item_idx").on(t.mediaItemId),
    check("user_media_position", sql`${t.season} >= 0 AND ${t.episode} >= 0 AND (${t.season} = 0) = (${t.episode} = 0)`),
  ],
);
