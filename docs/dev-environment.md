# Dev environment

How the development environment is set up and configured.

Everything runs inside a dev container. Open the repo in VS Code and choose
**Dev Containers: Reopen in Container** (or **Rebuild Container**).

## Before you start

Configuration files manage secrets and tooling setup:

```bash
cp .agents/mcp_config.example.json .agents/mcp_config.json # Antigravity MCP config
# cp .env.example .env                             # application secrets (when app is initialized)
```

## Configuration and secrets

Configuration is split by who consumes it:

| File | Holds | Read by |
| :--- | :--- | :--- |
| `.agents/mcp_config.json` | Context7 API key | Antigravity MCP server |
| `.env` | Database credentials, app secrets | The application runtime |

Both files are gitignored, with committed `.example` counterparts.

The application reads `.env` through Next.js, while Antigravity reads `.agents/mcp_config.json` directly.

## Antigravity and MCP

Antigravity loads project guidelines from [`AGENTS.md`](../AGENTS.md) and tool
configurations from [`.agents/mcp_config.json`](../.agents/mcp_config.json) (created from template [`.agents/mcp_config.example.json`](../.agents/mcp_config.example.json)).

Currently, Context7 is configured as an MCP server to provide up-to-date
documentation for libraries and tools.

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

