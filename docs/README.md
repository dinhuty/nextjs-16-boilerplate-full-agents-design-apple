# Documentation Index

All project documentation lives in the `docs/` directory. AI assistants working with this codebase **must** follow the conventions and patterns in these docs.

---

## Read documentation first

Before proposing solutions or making code changes, read the relevant docs and follow the [required reading order](#required-reading-order) below.

---

## Documentation structure

| Purpose | Location |
|--------|----------|
| **Project overview** | [project-overview.md](project-overview.md) |
| **Technology stack** | [technology.md](technology.md) |
| **Design system** | [../DESIGN.md](../DESIGN.md) |
| **Code structure & standards** | [core-principles-and-coding-standards/](core-principles-and-coding-standards/) |
| **Instructions & workflows** | [core-principles-and-coding-standards/instructions-and-work-flows/README.md](core-principles-and-coding-standards/instructions-and-work-flows/README.md) |
| **AI agent rules** | [ai-agent-guidelines.md](ai-agent-guidelines.md), [operation.md](operation.md) |

---

## Required reading order

When working on any task:

1. **Start** — [docs/README.md](README.md) (this file), [project-overview.md](project-overview.md)
2. **Guidelines** — [ai-agent-guidelines.md](ai-agent-guidelines.md), [AGENTS.md](../AGENTS.md)
3. **Structure & tech** — [technology.md](technology.md), [core-principles-and-coding-standards/structure.md](core-principles-and-coding-standards/structure.md)
4. **Patterns** — [coding-conventions](core-principles-and-coding-standards/coding-conventions.md), [coding-style](core-principles-and-coding-standards/coding-style.md), [design](../DESIGN.md)
5. **Framework docs** — Relevant page under `node_modules/next/dist/docs/01-app/` (see [AGENTS.md](../AGENTS.md) — this Next.js version may differ from your training data)
6. **Existing code** — Same or similar modules under `app/`

---

## Workflow process

| Step | Action |
|------|--------|
| 1. Analyze | Understand what to implement (page, feature, bugfix). |
| 2. Research | Read docs using the required reading order above. For any Next.js API, also read the bundled doc under `node_modules/next/dist/docs/01-app/`. |
| 3. Plan | Follow existing patterns (App Router file conventions, Server vs Client Components, data fetching). |
| 4. Implement | Write code that adheres to the conventions in [coding-conventions](core-principles-and-coding-standards/coding-conventions.md). |
| 5. Validate | Run `yarn lint` on changed files, then `yarn build` (TypeScript + Next.js compile). For UI changes, run `yarn dev` and verify on `http://localhost:3002`. |

---

## Quick links

- [Project overview](project-overview.md)
- [Technology](technology.md)
- [Design system](../DESIGN.md)
- [Structure](core-principles-and-coding-standards/structure.md)
- [Coding conventions](core-principles-and-coding-standards/coding-conventions.md)
- [Coding style](core-principles-and-coding-standards/coding-style.md)
- [Instructions and workflows](core-principles-and-coding-standards/instructions-and-work-flows/README.md)
- [AI agent guidelines](ai-agent-guidelines.md)
- [Operation (AI work rules)](operation.md)
