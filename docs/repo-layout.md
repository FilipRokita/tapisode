# 🗂️ Repo layout

What every entry in the repository root is for.

## Committed and tracked

| Path | What it is |
| :--- | :--- |
| [`README.md`](../README.md) | Project overview: what Tapisode does, the stack, and local run instructions. |
| [`AGENTS.md`](../AGENTS.md) | Instructions and rules for AI agents working in this repository. |
| [`docs/`](.) | Additional project documentation. |
| [`.devcontainer/`](../.devcontainer/) | Dev container configuration and setup scripts. See [Dev environment](dev-environment.md). |
| [`.env.example`](../.env.example) | Template for the application's `.env`. Copy it before the first run. |
| [`.gitignore`](../.gitignore) | Specifies deliberately untracked files to ignore. |
| [`package-lock.json`](../package-lock.json) | Dependency lockfile. |

## Gitignored

These exist locally on a development machine but remain out of git.

| Path | What it holds | Why it is ignored |
| :--- | :--- | :--- |
| `plans/` | Task implementation plans, local to one machine. | Machine-local planning. |
| `dev-only/` | Scratch space for prototypes and experiments. | Not part of the product. |
| `.env` | Application runtime secrets and database URLs. | Secrets (when added). |
| `node_modules/` | Installed npm packages. | Reproducible from lockfile. |

## Project structure

Once the Next.js application is initialized, application source code will reside in `src/`.

