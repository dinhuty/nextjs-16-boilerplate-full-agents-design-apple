# Technology

## Description

Main tech stack (versions pinned in `package.json`):

| Area | Technology |
|------|------------|
| **Framework** | Next.js 16.2.6 (App Router, Turbopack) |
| **UI library** | React 19.2.4 |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 via `@tailwindcss/postcss` |
| **Linting** | ESLint 9 (flat config in `eslint.config.mjs`, extends `eslint-config-next`) |
| **Package manager** | Yarn (yarn.lock committed) |
| **Build** | Next.js / Turbopack |

> ⚠️ Next.js 16 and React 19 are recent. **Treat training-data recall as untrusted.** Before using any Next.js API, read the matching guide under `node_modules/next/dist/docs/01-app/`. See [AGENTS.md](../AGENTS.md).

## Scope

- **In scope:** All frontend code under `app/`, `public/`, and config at the project root (`next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `package.json`).
- **Out of scope:** Backend services, infrastructure, deployment configuration (not yet present in this repo).

## Ports

| Command | Port | Source |
|---------|------|--------|
| `yarn dev` | `3002` | `next dev -p 3002` in `package.json` |
| `yarn start` | `3002` | `next start -p 3002` in `package.json` |

Override via the `PORT` env var or the `-p` CLI flag. Do not set a port in `next.config.ts` — there is no such option.

## Related documentation

- [Project overview](project-overview.md)
- [Structure](core-principles-and-coding-standards/structure.md)
- [Coding conventions](core-principles-and-coding-standards/coding-conventions.md)
- [Coding style](core-principles-and-coding-standards/coding-style.md)
