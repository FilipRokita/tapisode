# Catalog data

Where titles, posters and streaming availability come from, and the rules that come with
them. Read this before changing anything that stores, caches or shows provider data. A
mistake here can cost the API key.

## The rules we obey

| Topic | What we do |
| :--- | :--- |
| License | The free TMDB key is non-commercial only. A portfolio project fits. |
| Attribution | The official TMDB logo ([`public/tmdb-logo.svg`](../public/tmdb-logo.svg), unmodified) and the notice "This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB." (the terms' wording) appear in the README and the app's footer. |
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

## Home's lists

Home shows three lists from the provider: trending this week, in cinemas now and coming soon. They come from TMDB's
`/trending/all/week`, `/movie/now_playing` and `/movie/upcoming` (the last two for the user's country).

- Nothing in them is stored. They are fetched on the server and kept only in the host's data cache, which holds
  each answer for one hour, so they never get near the six-month limit.
- Because of that cache a page reload costs no provider call, so these calls have no per-user limit of their own.
  They still go through the shared gate.
- A title the user already tracks is left out. A list the provider cannot give right now is not shown, and the rest of
  Home still renders.

## Freshness

| Content | Refetched when opened if older than | Refreshed by the weekly job if older than |
| :--- | :--- | :--- |
| Ongoing, announced series and unreleased movies | 24 hours | 3 days |
| Ended series and released movies | 14 days | 60 days |
| Availability for a region | 72 hours | |

The job purges everything older than 150 days, then refreshes oldest first, at most 300
titles per run, five at a time. It stops starting new batches after 40 seconds, and the
next run continues. It refreshes availability for the default region (US) only, so other
regions are refreshed when someone opens the title. The numbers live in `FRESHNESS` in `src/config/constants.ts`.

## When content is missing

A title opened or listed without content is fetched on demand. If the provider is
unreachable, stored data is shown, and `+1` on a title without content is refused with a
message. A list says how many titles are loading.

## Where else data can sit

Posters and backdrops load in the browser straight from the TMDB image CDN and never pass through the
host's image optimizer, which would copy and cache them. Do not log TMDB content. Check
the retention of database backups on the host: it must stay under six months.

## Kill switch

`npm run catalog:kill -- --yes` deletes all TMDB content and stops every TMDB call. It
is the script `scripts/kill-switch.ts`.
