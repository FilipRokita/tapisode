# Dev environment

How the development environment is set up and configured.

Everything runs inside a dev container. Open the repo in VS Code and choose
**Dev Containers: Reopen in Container** (or **Rebuild Container**).

## Before you start

Create the environment file from its committed template:

```bash
cp .env.example .env
```

## Configuration and secrets

`.env` holds database credentials and app secrets. The application reads it
through Next.js. It is gitignored, with a committed `.env.example` counterpart.

## Agents

Agent guidelines live in [`AGENTS.md`](../AGENTS.md), the shared standard read by
most coding agents. It imports the README.

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

