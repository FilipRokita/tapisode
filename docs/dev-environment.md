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
  (GitHub CLI), VS Code extensions, port 3000 forwarding and `TZ=UTC`, so dates behave
  the same as on a host.
- `setup.sh` runs once as `postCreateCommand`. It needs `.env` to exist, then installs
  PostgreSQL, the dependencies (`npm ci`), the browser for the end-to-end tests and
  applies the migrations.
- `db-setup.sh` installs PostgreSQL 17 and creates the `tapisode` role with two
  databases: `tapisode` for development and `tapisode_test` for the tests. It is safe to
  run again, which is how a container that is not rebuilt gets the test database.
- `db-start.sh` starts the PostgreSQL cluster if it is not running.
- `start.sh` runs on every start (`postStartCommand`) and brings the database back up.

## Checks

| Command | What it checks |
| :--- | :--- |
| `npm run lint` | ESLint, including the import rules between layers |
| `npm run check:colors` | No raw colors outside `src/styles/tokens.css` |
| `npm run typecheck` | `next typegen` and `tsc --noEmit` |
| `npm test` | Vitest, run against `tapisode_test` |
| `npm run build` | The production build. It needs `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ characters) and `BETTER_AUTH_URL` in the environment |

CI runs the same commands on every push to `main` and on every pull request.

## A slow checkout

If the repository sits on a mounted Windows drive, installs and builds take minutes and
hot reload does not work. Clone it inside the container's own disk for a fast loop.
