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
| [`package-lock.json`](../package-lock.json) | Dependency lockfile. |

## Files you create yourself

These are gitignored, so you create each one from its committed template.

| Path | Created from | What it holds |
| :--- | :--- | :--- |
| `.env` | [`.env.example`](../.env.example) | Application secrets and the database URL. |
| `.mcp.json` | [`.mcp.example.json`](../.mcp.example.json) | MCP server configuration, with an optional Context7 key. |

## Project structure

Once the Next.js application is initialized, application source code will reside in `src/`.

