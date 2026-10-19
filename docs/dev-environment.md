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

- `devcontainer.json` configures the image (Node.js 24 on Debian Trixie),
  features (GitHub CLI), and VS Code extensions.
- `setup.sh` runs as `postCreateCommand` to install dependencies and configure local PostgreSQL.
- `db-setup.sh` installs PostgreSQL 17 and creates the `tapisode` role and database.
- `db-start.sh` starts the PostgreSQL cluster if not already running.
