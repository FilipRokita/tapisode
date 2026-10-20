# Extending Tapisode

## Add a catalog provider

The app talks to the catalog through the `MediaProvider` port in `src/domain/provider.ts`.
TMDB and the fake provider are two adapters of it.

1. Implement `MediaProvider` in `src/lib/providers/<name>/provider.ts`. Map the provider's
   data into our vocabulary (`ProviderTitle`, our service keys, our series states) and
   throw only `ProviderError`. Send every call through the shared `RequestGate`.
2. Register it in `src/lib/providers/index.ts`, the only file that names a concrete
   adapter, and add the name to `MEDIA_PROVIDER` in `src/config/env.ts`.
3. Add it to the contract tests in `tests/lib/provider-contract.test.ts`, which run the
   same expectations against every adapter, with hand-written fixtures in
   `tests/fixtures/`. Never commit recorded responses from a real provider.
4. Check the provider's caching and attribution terms and update
   [Catalog data](catalog-data.md).
5. Switching an existing deployment to another provider changes `external_id` values. Keep
   `imdb_id` as the bridge: write a migration that maps stored `(provider, external_id)`
   pairs to the new provider through the IMDb id before switching.

## Add a feature

Give it a module of its own, in the order the layers allow:

1. Schema in `src/db/schema/` and a new migration (`npm run db:generate`; never edit an
   applied one).
2. Rules in `src/domain/` as pure functions with tests.
3. The use case in `src/lib/`, then a Server Action in `src/actions/` that checks the
   session, validates the input with Zod and checks ownership before it changes anything.
4. The component in `src/components/`.
5. Add the rule to the tables in the plan's `rules.md` and a test for every row.

Lint enforces the layer order. A file that imports from a layer it may not reach fails
`npm run lint`.
