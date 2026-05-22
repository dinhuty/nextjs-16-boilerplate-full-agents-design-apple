<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ad-manager — AI Agent Guidelines

This file is the entry point for AI agents (Claude Code, Cursor, Copilot, etc.) working in this repo.

## Read documentation first

**Before proposing any solution or making code changes**, read the relevant documentation and follow the project's established patterns:

- **Start here:** [docs/README.md](docs/README.md) — documentation index, required reading order, and workflow process for AI agents.
- **AI rules:** [docs/ai-agent-guidelines.md](docs/ai-agent-guidelines.md) — do/don't reference and when to read which doc.

Use the [required reading order](docs/README.md#required-reading-order) in `docs/README.md` for each task.

## Project overview

ad-manager is an ad management web app built on Next.js 16. See [docs/project-overview.md](docs/project-overview.md) for description and environments.

## Documentation (links)

| Topic | Document |
|-------|----------|
| **Project overview** | [docs/project-overview.md](docs/project-overview.md) |
| **Technology stack** | [docs/technology.md](docs/technology.md) |
| **Design system** | [DESIGN.md](DESIGN.md) |
| **Code structure** | [docs/core-principles-and-coding-standards/structure.md](docs/core-principles-and-coding-standards/structure.md) |
| **Coding conventions** | [docs/core-principles-and-coding-standards/coding-conventions.md](docs/core-principles-and-coding-standards/coding-conventions.md) |
| **Coding style** | [docs/core-principles-and-coding-standards/coding-style.md](docs/core-principles-and-coding-standards/coding-style.md) |
| **Instructions & workflows** | [docs/core-principles-and-coding-standards/instructions-and-work-flows/README.md](docs/core-principles-and-coding-standards/instructions-and-work-flows/README.md) |
| **AI agent guidelines** | [docs/ai-agent-guidelines.md](docs/ai-agent-guidelines.md) |
| **Operation (AI work rules)** | [docs/operation.md](docs/operation.md) |

## Operation rules

Do **not** bypass without explicit user permission. See [docs/operation.md](docs/operation.md) for the rules (no-bypass-commit-hook, no-bypass-eslint, no-bypass-type-check, no-auto-release).

## Important notes

- **Use yarn** — `yarn.lock` is committed; do not switch to npm or pnpm.
- **Node version** — Use the version expected by the project; if commands fail, check Node version compatibility.
- **Dev/start port** — Pinned to `3002` in `package.json` scripts. Use `http://localhost:3002` when verifying.
- **Security** — Use environment variables (`.env.local`, `.env.*`); never commit secrets.
