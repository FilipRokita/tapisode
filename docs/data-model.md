# Data model

The schema lives in `src/db/schema/` and the migration in `src/db/migrations/`.

## Relationships

```
user ──< user_media >── media_items ──1:1── media_content
 │                           │
 ├──< session                └──< media_availability (per region)
 ├──< account
 └── (anonymous users are sandboxes)

verification, rate_limit           Better Auth's own tables
request_counter, maintenance_run   operational tables
```

`user_media` points at `media_items` with `ON DELETE RESTRICT` and at `user` with
`ON DELETE CASCADE`. Deleting an account deletes its titles. Nothing deletes a
`media_items` row.

## Two kinds of data

- **Catalog content is a cache.** `media_content` and `media_availability` hold what
  the provider sent, and can be emptied without touching anyone's list. This is
  what makes the 6-month rule safe.
- **User state is ours.** `user_media` holds one row per user and title: a status and a
  position, not per-episode marks.

Nothing in the schema is TMDB-shaped. A title is `provider + media_type + external_id`,
and statuses, seasons and services use our own vocabulary.

## Columns that carry behavior

| Column | Why it matters |
| :--- | :--- |
| `user_media.season`, `episode` | The last watched episode. `0, 0` means not started. A check constraint forces both to be zero or both positive |
| `user_media.activity_at` | The last change. It orders Watching, so the newest is "Up next" |
| `user_media.started_at`, `completed_at` | Set on first leaving Watchlist, set on entering Complete and cleared on leaving it |
| `media_content.poster_path`, `backdrop_path` | Paths only, never URLs, so the provider builds the URL. The backdrop is the wide image behind the title drawer. Both go with the rest of the content when it is purged |
| `media_content.fetched_at` | Drives refresh and the 150-day purge |
| `media_content.seasons` | `[{number, episodeCount, airedCount}]`, the basis of every progress number |
| `media_availability.services` | Our service keys for one region. An empty array means none carry it, a missing row means not fetched |

## What the diagram does not show

Which combinations of status and position are valid is a domain rule, not a database
constraint, because it depends on the title's seasons, which live in another table and
change. A Watchlist series is always `0, 0`, a Complete series is always on its last
episode, and Watching sits in between. The rules are in `src/domain/transitions.ts`
(`isConsistent`).

## Writes

Every change goes through a compare-and-set: the update applies only if the stored
state is the one the caller saw. Zero rows updated means a conflict, which covers a
double tap, a retry, a second device and a late undo.

## Migrations

- Migrations are applied by `npm run db:migrate` (`drizzle-kit migrate`), which uses
  `DATABASE_URL_UNPOOLED` when set and `DATABASE_URL` otherwise.
- A change that removes or renames something ships in two migrations across two
  deployments: add the new shape and write both, then remove the old one.
- The tests start from an empty schema and apply the real migrations, so a migration
  that does not apply fails the suite.
