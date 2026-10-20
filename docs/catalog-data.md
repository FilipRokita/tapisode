# Catalog data

Where titles, posters and streaming availability come from, and the rules that come with
them. Read this before changing anything that stores, caches or shows provider data. A
mistake here can cost the API key.

## The rules we obey

| Topic | What we do |
| :--- | :--- |
| License | The free TMDB key is non-commercial only. A portfolio project fits. |
| Attribution | The TMDB logo and the notice "uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB" appear in the README and the app's footer. |
| Logo prominence | The TMDB logo is always less prominent than Tapisode's own branding. |
| Streaming data | Availability is credited to JustWatch wherever it is shown. |
| 6-month rule | TMDB content is never kept longer than six months. We purge at **150 days**, a month inside the limit. |
| No TMDB content in the repo | Tests, the landing, README images and the seed use the fake provider. The seed lists TMDB ids only. |
| Rate limit | A shared gate keeps calls well under TMDB's ceiling and pauses on HTTP 429. |
| Links out | Availability is shown, never linked. There are no deep links to services. |

## What is stored

- `media_items` keeps only keys (`provider`, `media_type`, `external_id`) and is never
  purged. Keeping the id is an accepted risk: the terms forbid caching "any
  information" past six months and do not name identifiers, and the app cannot work
  without them.
- `media_content` and `media_availability` hold everything TMDB sent, each with a
  `fetched_at`. Only these are purged. A user's list never depends on them.

See [Data model](data-model.md) for the tables.

## Freshness

| Content | Refetched when opened if older than | Refreshed by the weekly job if older than |
| :--- | :--- | :--- |
| Ongoing, announced series and unreleased movies | 24 hours | 3 days |
| Ended series and released movies | 14 days | 60 days |
| Availability for a region | 72 hours | |

The job refreshes oldest first, at most 300 titles per run, then purges everything
older than 150 days. The numbers live in `FRESHNESS` in `src/config/constants.ts`.

## When content is missing

A title opened or listed without content is fetched on demand. If the provider is
unreachable, stored data is shown, and `+1` on a title without content is refused with a
message. A list says how many titles are loading.

## Where else data can sit

Posters load in the browser straight from the TMDB image CDN and never pass through the
host's image optimizer, which would copy and cache them. Do not log TMDB content. Check
the retention of database backups on the host: it must stay under six months.

## Kill switch

`npm run catalog:kill -- --yes` deletes all TMDB content and stops every TMDB call. It
is the script `scripts/kill-switch.ts`.
