# Coding Conventions

Conventions for routing, components, data flow, styling, and config in ad-manager.

> Before writing Next.js code, read the matching guide in `node_modules/next/dist/docs/01-app/`. This version may differ from your training data.

## General principles

- **Readability first** — Code should be self-documenting; reach for a comment only when the *why* is non-obvious.
- **Consistency** — Follow existing patterns in `app/` and this docs/ folder before inventing new ones.
- **Surgical changes** — Touch only what the task requires; don't refactor adjacent code unless asked.

## Routing (App Router)

- Define routes by creating folders under `app/`; add `page.tsx` to expose a URL.
- Use `loading.tsx` / `error.tsx` / `not-found.tsx` for the standard async + failure UX instead of hand-rolling state.
- Client-side navigation: `<Link href="...">` from `next/link`; programmatic from `next/navigation` (`useRouter`, `usePathname`, `useSearchParams`).
- `params` and `searchParams` are **async** — `await` them in Server Components.

## Components

- **Server by default.** Add `"use client"` only when the file needs state, effects, event handlers, or browser APIs.
- **Compose, don't dump.** Break large pages into smaller components; keep route files (`page.tsx`, `layout.tsx`) lean.
- **TypeScript:** type props explicitly; avoid `any` — prefer `unknown` and narrow.

## Data fetching

- Fetch in Server Components with `fetch()` — Next.js extends `fetch` with caching options (`cache: 'force-cache' | 'no-store'`, `next: { revalidate, tags }`). Read `06-fetching-data.md` and `08-caching.md`.
- Don't fetch in Client Components when a parent Server Component can fetch and pass data down.
- Don't use `getServerSideProps` / `getStaticProps` — those are Pages Router and not available here.

## Mutations and forms

- Use **Server Actions** (`"use server"` functions). Forms submit directly to Server Actions; pair with `revalidatePath` / `revalidateTag` to refresh caches.
- Read `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md` before implementing forms.

## API endpoints

- For HTTP endpoints inside the app, create `app/<segment>/route.ts` with `GET` / `POST` / etc. exports. Reference: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`.
- Don't introduce a new HTTP client wrapper unless the codebase needs one across many call sites.

## Styling

- **Tailwind CSS 4.** Use utility classes in JSX; global styles go in `app/globals.css`.
- Follow [DESIGN.md](../../DESIGN.md) (project root, managed by `getdesign` CLI) for tokens, spacing scale, typography, and component-level conventions.
- Avoid inline `style={{ ... }}` for things Tailwind can express. Reserve it for truly dynamic values.

## Configuration

- All Next.js config in `next.config.ts`. Validate options against `node_modules/next/dist/docs/01-app/03-api-reference/05-config/` — long-removed flags (e.g. `experimental.appDir`) must not be re-introduced.
- Port is **not** a `next.config.ts` option. It is set in `package.json` scripts (`next dev -p 3002`, `next start -p 3002`) or via the `PORT` env var.

## Environment variables

- Server-side secrets: `.env.local` (gitignored). Access via `process.env.MY_SECRET`.
- Browser-exposed: must be prefixed `NEXT_PUBLIC_*`. Treat anything `NEXT_PUBLIC_*` as public — never put secrets there.
- Do not commit real secrets. `.env.local` should be in `.gitignore`.

## Logging

- No dedicated logger required at this stage. Use `console.error` for genuine errors; avoid logging tokens, PII, or full request bodies.

## Security

- Never expose secrets via `NEXT_PUBLIC_*`.
- Validate user input at every Server Action / Route Handler boundary (manual checks or a schema lib if one is added later).
- Do not run untrusted code in Server Components — they have full server access.

## Related documentation

- [Structure](structure.md)
- [Coding style](coding-style.md)
- [Design system](../../DESIGN.md)
- [Technology](../technology.md)
