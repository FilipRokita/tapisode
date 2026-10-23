# Dev environment

How the development environment is set up and configured.

Everything runs inside a dev container. Open the repo in VS Code and choose
**Dev Containers: Reopen in Container** (or **Rebuild Container**).

## Before you start

Create the environment files from their committed templates:

```bash
cp .env.example .env
cp .mcp.example.json .mcp.json   # optional, for the Context7 MCP server
```

## Configuration and secrets

`.env` holds database credentials and app secrets. The application reads it
through Next.js. It is gitignored, with a committed `.env.example` counterpart.

## Agents

Agent guidelines live in [`AGENTS.md`](../AGENTS.md), the shared standard read by
most coding agents. It imports the README.

MCP servers are declared in `.mcp.json`, the format Claude Code reads. It is
gitignored and created from [`.mcp.example.json`](../.mcp.example.json). Other
agents need the same server in their own config. Currently Context7 is
configured, to serve up-to-date library documentation. It works without a key,
and adding your key to the `Authorization` header raises the rate limits. Claude
Code asks for approval the first time it sees a project MCP server.

## The dev container

The container definition lives in `.devcontainer/`:

- `devcontainer.json` configures the image (Node.js 24 on Debian Trixie), features
  (GitHub CLI), VS Code extensions and `TZ=UTC`, so dates behave
  the same as on a host.
- `setup.sh` runs once as `postCreateCommand`. It needs `.env` to exist, then installs
  PostgreSQL, the dependencies (`npm ci`), the browser for the end-to-end tests and
  applies the migrations.
- `db-setup.sh` installs PostgreSQL 17 and creates the `tapisode` role with two
  databases: `tapisode` for development and `tapisode_test` for the tests. It is safe to
  run again, which is how a container that is not rebuilt gets the test database.
- `db-start.sh` starts the PostgreSQL cluster if it is not running.
- `start.sh` runs on every start (`postStartCommand`): it brings the database back up,
  applies any new migrations and seeds the sandbox template and the dev account the first
  time (`npm run db:seed -- --if-missing`), so a restart leaves your data alone.

## Dev account and seed

`npm run db:seed` fills the sandbox template and creates the dev account
`dev@tapisode.test` with the password `tapisode-dev`. It follows `MEDIA_PROVIDER`: with
`fake` it uses invented titles, with `tmdb` it uses TMDB ids. `-- --template-only`
creates just the template, which is what a host needs, and `-- --if-missing` does
nothing when the template already exists.

## Checks

| Command | What it checks |
| :--- | :--- |
| `npm run lint` | ESLint, including the import rules between layers |
| `npm run check:colors` | No raw colors outside `src/styles/tokens.css` |
| `npm run typecheck` | `next typegen` and `tsc --noEmit` |
| `npm test` | Vitest, run against `tapisode_test` |
| `npm run test:e2e` | Playwright against the production build, desktop and phone. Needs `npm run build` first |
| `npm run assets` | Regenerates the icons, the Open Graph image and the offline page from the design tokens |
| `npm run screenshots` | Regenerates the README pictures from the built app on the fake provider |
| `npx lhci autorun` | Lighthouse budgets on `/`, `/signin` and `/privacy` (set `CHROME_PATH` to the Playwright Chromium) |
| `npm run build` | The production build. It needs `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ characters) and `BETTER_AUTH_URL`, `LEGAL_CONTROLLER_NAME` and `LEGAL_CONTACT_EMAIL` in the environment |

## End-to-end tests

They run against the production build and the **test database**, which is dropped and
migrated again before every run. Write them with the helpers in `e2e/`:

- Import `test` and `expect` from `e2e/fixtures.ts`. Each test gets its own client IP, so
  the sandbox limit (5 an hour per IP) never gets in the way.
- Use `withTestSql` from `e2e/db.ts` for setup the UI cannot do.

The end-to-end suite also runs axe on every screen and the responsive and reduced-motion checks.

## Migrations on a host

`vercel.json` runs `npm run db:migrate` and `npm run db:seed -- --template-only --if-missing` before `next build`, but only
when `VERCEL_ENV=production` (a push to `main`). It also deploys only `main`: preview deployments are off, so nothing but
production ever touches the database. If you turn previews on, give them their own Neon branch and migrate it by hand with
`DATABASE_URL_UNPOOLED=<branch> npm run db:migrate`.

CI runs the same commands on every push to `main` and on every pull request.

## A slow checkout

If the repository sits on a mounted Windows drive, installs and builds take minutes and
hot reload would not work, because that mount does not deliver file change events and Turbopack
waits for them. `npm run dev` therefore runs webpack with `WATCHPACK_POLLING=true`, which polls for
changes. Cloning the repository onto the container's own disk gives a faster loop still.

## The installable app (PWA)

The manifest, the icons and the offline page are generated from the design tokens by `npm run assets` (it needs the
Playwright Chromium). The service worker in `public/sw.js` only serves the offline page when a page cannot load, and it
is registered in production builds only.

To try it locally, run `npm run build` and `npm run start`. `next dev --experimental-https` creates a root CA inside the
container only, so a real phone needs a real HTTPS deployment.

## Before release

A real phone has things a browser test cannot check. Run this once after the first deployment:

- Install from Chrome on Android and from Safari on iOS.
- Open from the icon: there is no browser chrome, and the status bar and the splash match the app.
- Sign in again inside the installed iOS app (it has separate storage).
- The title drawer closes with the back gesture on Android.
- Airplane mode shows the offline page.
- `+1` works, and the phone vibrates on Android.
- Have a qualified person read the privacy policy and the terms before real users rely on them.
