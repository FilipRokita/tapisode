# 🗂️ Repo layout

What every entry in the repository root is for.

## Committed and tracked

| Path | What it is |
| :--- | :--- |
| [`README.md`](../README.md) | Project overview: what Tapisode does, the stack, and local run instructions. |
| [`AGENTS.md`](../AGENTS.md) | Instructions and rules for AI agents working in this repository. Agent-neutral. |
| [`docs/`](.) | Additional project documentation. |
| [`.mcp.json`](../.mcp.json) | Project MCP servers in the format Claude Code reads (Context7). The API key comes from the container environment. |
| [`.devcontainer/`](../.devcontainer/) | Dev container configuration and setup scripts. See [Dev environment](dev-environment.md). |
| [`.gitignore`](../.gitignore) | Specifies deliberately untracked files to ignore. |
| [`package-lock.json`](../package-lock.json) | Dependency lockfile. |

## Gitignored

These exist locally on a development machine but remain out of git.

| Path | What it holds | Why it is ignored |
| :--- | :--- | :--- |
| `plans/` | Task implementation plans, local to one machine. | Machine-local planning. |
| `dev-only/` | Scratch space for prototypes and experiments. | Not part of the product. |
| `.env` | Application runtime secrets and database URLs. | Secrets (when added). |
| `.devcontainer/.env` | Tooling secrets for the dev container (Context7 API key). | Secrets. |
| `node_modules/` | Installed npm packages. | Reproducible from lockfile. |

## Project structure

Once the Next.js application is initialized, application source code will reside in `src/`.

