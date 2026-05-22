# Structure

This document describes the directory structure and patterns to follow in ad-manager.

## Directory structure

```
ad-manager/
├── app/                       # App Router — routes, layouts, pages, Server Actions
│   ├── layout.tsx             # Root layout (required)
│   ├── page.tsx               # Home route (/)
│   ├── globals.css            # Tailwind v4 @theme tokens (mirrors DESIGN.md)
│   ├── login/                 # /login route + co-located Server Actions
│   │   ├── actions.ts         # signIn / signOut
│   │   └── page.tsx
│   └── ...                    # Nested route segments (folders become URL segments)
├── components/                # UI building blocks — atoms → molecules → organisms
│   ├── atoms/                 # Smallest reusable primitives (Button, Input, Label, ErrorMessage)
│   ├── molecules/             # Compositions of atoms (FormField)
│   └── organisms/             # Feature blocks (LoginForm, SignOutButton)
├── utils/supabase/            # Supabase client helpers
│   ├── client.ts              # createBrowserClient — client components
│   ├── server.ts              # createClient (async) — Server Components / Server Actions
│   └── middleware.ts          # updateSession — refresh + route protection
├── proxy.ts                   # Edge proxy — Next.js 16 convention (calls updateSession)
├── supabase/
│   ├── migrations/            # SQL migrations (NNNN_description.sql, ascending)
│   └── seed.sql               # Optional seed data
├── public/                    # Static assets served at /
├── docs/                      # Project documentation (this folder)
├── DESIGN.md                  # Design tokens (managed by `getdesign` CLI)
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
├── eslint.config.mjs          # ESLint flat config
├── postcss.config.mjs         # PostCSS / Tailwind
└── package.json
```

## Component hierarchy

The `components/` tree follows the same atoms / molecules / organisms split used in **acm-web**:

| Layer | Purpose | Examples in this repo |
|---|---|---|
| **atoms** | Smallest reusable UI primitives. No business logic. No composition of other components. | [`Button`](../../../components/atoms/Button.tsx), [`Input`](../../../components/atoms/Input.tsx), [`Label`](../../../components/atoms/Label.tsx), [`ErrorMessage`](../../../components/atoms/ErrorMessage.tsx) |
| **molecules** | Small compositions of atoms. Re-usable in multiple organisms. | [`FormField`](../../../components/molecules/FormField.tsx) (Label + Input + ErrorMessage) |
| **organisms** | Feature-specific blocks. May wire to Server Actions, fetch data, or hold local state. | [`LoginForm`](../../../components/organisms/LoginForm.tsx), [`SignOutButton`](../../../components/organisms/SignOutButton.tsx) |
| **pages** | Route-level views under `app/<segment>/page.tsx`. Compose organisms; keep this thin. | [`app/login/page.tsx`](../../../app/login/page.tsx), [`app/page.tsx`](../../../app/page.tsx) |

Rules:

- **Direction is one-way.** Atoms never import molecules / organisms / pages. Molecules never import organisms / pages. Organisms never import pages.
- **Reuse before adding.** Check existing atoms / molecules first. Add a new one only if no existing component fits.
- **PascalCase filenames** matching the component name (`Button.tsx` exports `Button`). One component per file.
- **No `index.ts` re-export barrels** — import directly via `@/components/<layer>/<Component>` to keep the dependency graph explicit.
- **Client vs server.** A Client Component (`"use client"`) cannot be imported by a Server Component in a way that breaks the boundary. Push `"use client"` down to the smallest leaf that actually needs it. Server Actions live in `*.ts` files next to the route or component that uses them.

## App Router file conventions

These special filenames inside `app/` have meaning to Next.js. Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/` before adding new ones.

| File | Purpose |
|------|---------|
| `layout.tsx` | Shared UI for a segment and its children (must render `{children}`) |
| `page.tsx` | UI for a route — makes the segment publicly accessible |
| `loading.tsx` | Loading UI (wraps children in a `<Suspense>` boundary) |
| `error.tsx` | Error UI (must be a Client Component) |
| `not-found.tsx` | UI for `notFound()` or unmatched routes |
| `route.ts` | API endpoint (Route Handler — `GET`, `POST`, etc.) |
| `template.tsx` | Re-mounted layout (rarely needed) |
| `default.tsx` | Fallback for parallel routes |
| `middleware.ts` | Runs before requests are completed (root only) |

## Server vs Client Components

- **Default: Server Component.** Renders on the server, can `await`, can read files / call DBs / use server-only secrets, cannot use state/effects or browser APIs.
- **`"use client"` at the top of the file** turns the module and everything it imports into a Client Component. Required when the file uses `useState`, `useEffect`, event handlers, `useRouter` from `next/navigation`, or browser-only APIs.
- **Keep the client boundary thin.** Push `"use client"` down to the smallest leaf that actually needs it; keep parents as Server Components so data fetching stays on the server.

## Routing

- Folder name = URL segment. `app/dashboard/page.tsx` → `/dashboard`.
- Dynamic segments: `app/posts/[id]/page.tsx` → `/posts/123`. `params` is async — `const { id } = await params`.
- Search params on a page: `searchParams` is async — `const sp = await searchParams`.
- Programmatic navigation in Client Components: `useRouter`, `usePathname`, `useSearchParams` from `next/navigation` (not `next/router`).
- Links: `<Link href="...">` from `next/link`.

## Data fetching and mutations

- **Read:** call `fetch` directly inside a Server Component (or a server-side helper). Use the `cache` option and `next.revalidate` to control caching. Read `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`.
- **Write:** Server Actions (`"use server"` functions). Forms can submit directly to Server Actions. Read `07-mutating-data.md`.
- **Cache invalidation:** `revalidatePath` / `revalidateTag` from `next/cache`.

## Configuration

- All Next.js options go in `next.config.ts` (TypeScript). Reference: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/`.
- Do not put port settings in `next.config.ts` — port is a CLI / env concern.

## Aliases

Default Next.js alias: `@/*` → project root (configured in `tsconfig.json` if present). Use this in imports instead of long relative paths.

## Related documentation

- [Coding conventions](coding-conventions.md)
- [Coding style](coding-style.md)
- [Technology](../technology.md)
