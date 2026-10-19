# Dev environment

How the development environment is set up and configured.

Everything runs inside a dev container. Open the repo in VS Code and choose
**Dev Containers: Reopen in Container** (or **Rebuild Container**).

## Before you start

Create the environment files from their committed templates:

```bash
# cp .env.example .env                         # when the app is initialized
cp .devcontainer/.env.example .devcontainer/.env
```

## Configuration and secrets

| File | Holds | Read by |
| :--- | :--- | :--- |
| `.env` | Database credentials, app secrets | The application runtime |
| `.devcontainer/.env` | Context7 API key | Agent tooling, through `.mcp.json` |

Both files are gitignored, with committed `.env.example` counterparts.

The dev container loads `.devcontainer/.env` into its environment through
`runArgs` in `devcontainer.json`. The file must exist before the container
starts, otherwise Docker fails to create it.

## Agents and MCP

Agent guidelines live in [`AGENTS.md`](../AGENTS.md), the shared standard read by
most coding agents. It imports the README.

MCP servers are declared in [`.mcp.json`](../.mcp.json), the format Claude Code
reads. Other agents need the same server in their own config. Currently,
Context7 is configured to provide up-to-date documentation for libraries and
tools. Claude Code asks for approval the first time it sees a project MCP
server.

## The dev container

The container definition lives in `.devcontainer/`:

- `devcontainer.json` configures the image (Node.js 24 on Debian Trixie),
  features (GitHub CLI), and VS Code extensions.
- `setup.sh` runs as `postCreateCommand` to install dependencies and configure local PostgreSQL.
- `db-setup.sh` installs PostgreSQL 17 and creates the `tapisode` role and database.
- `db-start.sh` starts the PostgreSQL cluster if not already running.

## Dev only

`dev-only/` is a gitignored scratch space for prototypes and experiments. It is
not part of the repository.

