# AI Agent Guidelines

Do/don't reference and when to read which document when working as an AI agent on ad-manager.

## Read documentation first

Use the [required reading order](README.md#required-reading-order) in `docs/README.md` for each task. This file adds do/don't and when to read which doc.

## Do

- **Read the Next.js bundled docs** — Before touching any Next.js API (routing, fetching, caching, Server Actions, config), open the matching file in `node_modules/next/dist/docs/01-app/`. Training data may be stale.
- **Use the right structure** — Routes in `app/` (App Router file conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts`, `not-found.tsx`). Follow [structure](core-principles-and-coding-standards/structure.md).
- **Default to Server Components** — Add `"use client"` only when the file genuinely needs client-only APIs (state, effects, browser APIs, event handlers).
- **Use TypeScript properly** — Avoid `any`; prefer `unknown` or narrowed types. Run `yarn build` before considering changes done.
- **Follow the design system** — See [DESIGN.md](../DESIGN.md) (project root, managed by `getdesign` CLI) for design tokens, spacing, typography, and component conventions.
- **Use yarn** — `yarn.lock` is committed. Run `yarn lint` on changed files and `yarn build` before declaring work complete.

## Don't

- **Don't invent new architectural patterns** — Don't introduce a new state library, router, or HTTP client without project agreement. Follow [structure](core-principles-and-coding-standards/structure.md) and [coding conventions](core-principles-and-coding-standards/coding-conventions.md).
- **Don't bypass hooks, ESLint, or type-check; don't run deploy/release** — See [operation.md](operation.md).
- **Don't commit secrets** — Use `.env.local` (gitignored) for local secrets; never commit real keys. Only `NEXT_PUBLIC_*` env vars are exposed to the browser.
- **Don't add port settings to `next.config.ts`** — Port is set via the `-p` CLI flag in `package.json` scripts (currently `3002`) or the `PORT` env var. Next.js config has no port option.
- **Don't use Pages Router APIs** — No `getServerSideProps` / `getStaticProps` / `next/router` in this project; this is App Router only. Use Server Components + `fetch` + `next/navigation`.

## When to read which doc

| Task | Read first | Then |
|------|------------|------|
| New page / new route | [structure](core-principles-and-coding-standards/structure.md), [technology](technology.md) | [Adding a new page](core-principles-and-coding-standards/instructions-and-work-flows/adding-a-new-page.md) (when this workflow exists) and the matching file in `node_modules/next/dist/docs/01-app/01-getting-started/` |
| New feature / new flow | [coding-conventions](core-principles-and-coding-standards/coding-conventions.md), [structure](core-principles-and-coding-standards/structure.md) | Existing similar feature under `app/` |
| Data fetching / caching | `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`, `08-caching.md` | [coding-conventions](core-principles-and-coding-standards/coding-conventions.md) |
| Forms / mutations / Server Actions | `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` | [coding-conventions](core-principles-and-coding-standards/coding-conventions.md) |
| Styling / Tailwind | [DESIGN.md](../DESIGN.md), [coding-conventions](core-principles-and-coding-standards/coding-conventions.md) | `app/globals.css`, existing components |
| Config (`next.config.ts`) | `node_modules/next/dist/docs/01-app/03-api-reference/05-config/` | [coding-conventions](core-principles-and-coding-standards/coding-conventions.md) |
| Lint / format / env | [coding-style](core-principles-and-coding-standards/coding-style.md) | [operation](operation.md) |

## Related

- [AGENTS.md](../AGENTS.md) — Entry point
- [Operation](operation.md) — AI work rules
- [Design system](../DESIGN.md)
