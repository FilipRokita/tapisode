# 🗂️ Repo layout

What every entry in the repository root is for.

## Committed and tracked

| Path | What it is |
| :--- | :--- |
| [`README.md`](../README.md) | Project overview: what Tapisode does, the stack, and local run instructions. |
| [`AGENTS.md`](../AGENTS.md) | Instructions and rules for AI agents working in this repository. |
| [`docs/`](.) | Additional project documentation. |
| [`.devcontainer/`](../.devcontainer/) | Dev container configuration and setup scripts. See [Dev environment](dev-environment.md). |
| [`.mcp.example.json`](../.mcp.example.json) | Template for the local `.mcp.json`: MCP servers in the format Claude Code reads (Context7). |
| [`.env.example`](../.env.example) | Template for the application's `.env`. Copy it before the first run. |
| [`.gitignore`](../.gitignore) | Specifies deliberately untracked files to ignore. |
| [`package.json`](../package.json) / [`package-lock.json`](../package-lock.json) | Dependencies, pinned versions and the npm scripts. |
| [`src/`](../src/) | The application: `app/` (routes), `config/`, and, as the stages land, `domain/`, `db/`, `lib/`, `actions/`, `components/`. |
| [`docs/data-model.md`](data-model.md) | The tables, the relationships and what the database enforces. |
| [`tests/`](../tests/) | Vitest tests, mirroring `src/`. |
| [`scripts/`](../scripts/) | Developer scripts run with `tsx`, such as `check-colors.ts`. |
| [`.github/workflows/`](../.github/workflows/) | CI. |
| [`next.config.ts`](../next.config.ts), [`drizzle.config.ts`](../drizzle.config.ts), [`tsconfig.json`](../tsconfig.json), [`eslint.config.mjs`](../eslint.config.mjs), [`postcss.config.mjs`](../postcss.config.mjs), [`vitest.config.ts`](../vitest.config.ts), [`components.json`](../components.json) | Tool configuration. |

## Files you create yourself

These are gitignored, so you create each one from its committed template.

| Path | Created from | What it holds |
| :--- | :--- | :--- |
| `.env` | [`.env.example`](../.env.example) | Application secrets and the database URL. |
| `.mcp.json` | [`.mcp.example.json`](../.mcp.example.json) | MCP server configuration, with an optional Context7 key. |

## Project structure

Application source code lives in `src/`. The import rules between its layers are enforced by
ESLint, see `eslint.config.mjs`.

