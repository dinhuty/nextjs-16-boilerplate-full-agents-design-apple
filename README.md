# ad-manager

Ad management web app built on **Next.js 16** (App Router, Turbopack), **React 19**, **Supabase** (Auth + DB), and **Tailwind CSS 4**. Apple-inspired design system in [DESIGN.md](DESIGN.md).

> See [AGENTS.md](AGENTS.md) for AI agent rules and [docs/README.md](docs/README.md) for the documentation index.

---

## Prerequisites

- **Node.js** — version matching the project's tooling (check `package.json` if commands fail).
- **Yarn** — `yarn.lock` is committed; do not switch to `npm` or `pnpm`.
- **Supabase project** — create one at https://supabase.com (free tier is fine).

---

## Setup

### 1. Install dependencies

```bash
yarn install
```

### 2. Configure environment variables

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-or-anon-key>
# Public origin of this app. Used to build the email-confirmation link
# in supabase.auth.signUp(emailRedirectTo: ...). Leave unset locally and
# the signUp action falls back to the request's Host header.
NEXT_PUBLIC_SITE_URL=http://localhost:3002
```

Get the first two from **Supabase Dashboard → Project Settings → API**.

> ⚠️ Only `NEXT_PUBLIC_*` env vars are sent to the browser. Never put the `service_role` key in any `NEXT_PUBLIC_*` variable.

### 2b. Configure Supabase Auth URLs

Supabase only emails confirmation / magic-link URLs that match its allow-list. The default Site URL is `http://localhost:3000`, so without this step the confirmation link points to the wrong port (or domain in production).

**Dashboard → Authentication → URL Configuration:**

| Field | Local dev value | Notes |
|---|---|---|
| **Site URL** | `http://localhost:3002` | Fallback used when `emailRedirectTo` is not specified. |
| **Redirect URLs** (allow list) | `http://localhost:3002/auth/callback` | Add **all** environments you'll use, one per line (e.g. `https://staging.example.com/auth/callback`, `https://app.example.com/auth/callback`). |

The signUp Server Action passes `emailRedirectTo: <NEXT_PUBLIC_SITE_URL>/auth/callback` automatically — this URL must appear in the Redirect URLs list above or Supabase will fall back to Site URL.

The handler at [`app/auth/callback/route.ts`](app/auth/callback/route.ts) exchanges the `?code=...` query parameter for a session, then redirects to `/`.

### 3. Apply the database migration

The app queries a `todos` table protected by Row Level Security (RLS). Apply the migration before signing in.

**Option A — Supabase Dashboard (no CLI needed):**

1. Open **Supabase Dashboard → SQL Editor → New query**.
2. Paste the contents of [`supabase/migrations/0001_create_todos.sql`](supabase/migrations/0001_create_todos.sql).
3. Click **Run**.

**Option B — Supabase CLI (one-time auth + link, then push):**

```bash
bash run.sh login                     # one-time per machine (opens browser)
bash run.sh link <your-project-ref>   # one-time per repo clone
bash run.sh migrate                   # applies supabase/migrations/*.sql
```

Find your project ref at **Supabase Dashboard → Project Settings → General**, or it's the subdomain of your `NEXT_PUBLIC_SUPABASE_URL` (e.g. `abcxyz123` in `https://abcxyz123.supabase.co`).

`bash run.sh migrate` will refuse to run if the repo isn't linked and print the command above.

### 4. Create a test user

- **Dashboard → Authentication → Users → Add User → Create new user**
- Fill email + password (toggle "Auto Confirm User" so you don't have to verify email).

### 5. (Optional) Seed some todos

Edit [`supabase/seed.sql`](supabase/seed.sql), replace `<USER_UUID>` with your test user's UID (visible on the user row in the dashboard), uncomment the inserts, then run it in the SQL Editor.

### 6. Run the dev server

```bash
yarn dev
```

Open **http://localhost:3002** — you should be redirected to `/login`. Sign in with the test user and you'll land on the todos page.

---

## Scripts

| Command | What it does |
|---|---|
| `yarn dev` | Dev server on `http://localhost:3002` (Turbopack). |
| `yarn build` | Production build + TypeScript type-check. **Required to pass before merging.** |
| `yarn start` | Production server on `http://localhost:3002` (needs prior `yarn build`). |
| `yarn lint` | ESLint. **Required to pass before merging.** |
| `yarn typecheck` | TypeScript only (`tsc --noEmit`). |
| `yarn verify` | Lint + typecheck. |
| `yarn db:push` | Apply migrations via Supabase CLI. |
| `yarn db:new` | Create a new migration file. |
| `yarn db:seed` | Apply `supabase/seed.sql` (psql if `DATABASE_URL` is set, otherwise prints Dashboard instructions). |
| `yarn deploy` | Run the deploy placeholder in `run.sh` (configure for your host). |

For a single entry point that wraps these (including multi-step `seed` and `deploy`), use **`run.sh`** — see [RUN.md](RUN.md).

---

## Project structure

```
ad-manager/
├── app/                       # Next.js App Router
│   ├── login/                 # /login route + Server Actions
│   │   ├── actions.ts         # signIn / signUp / signOut Server Actions
│   │   └── page.tsx
│   ├── signup/                # /signup route
│   │   └── page.tsx
│   ├── auth/callback/         # Supabase email-confirmation / OAuth callback
│   │   └── route.ts
│   ├── layout.tsx
│   ├── page.tsx               # / (home, protected)
│   └── globals.css            # Tailwind v4 @theme tokens (mirrors DESIGN.md)
├── components/                # atoms → molecules → organisms (see docs/.../structure.md)
│   ├── atoms/
│   ├── molecules/
│   └── organisms/
├── utils/supabase/            # Supabase client helpers (server / client / middleware)
├── proxy.ts                   # Refreshes Supabase session + redirects unauthed users (Next.js 16 convention; replaces middleware.ts)
├── supabase/
│   ├── migrations/            # SQL migrations (NNNN_description.sql, ascending)
│   └── seed.sql               # Optional seed data
├── docs/                      # AI / contributor documentation
├── DESIGN.md                  # Design tokens (managed by `getdesign` CLI)
├── AGENTS.md                  # AI agent rules entry point
└── CLAUDE.md                  # → @AGENTS.md
```

---

## Auth flow

1. **Proxy** ([`proxy.ts`](proxy.ts) → [`utils/supabase/middleware.ts`](utils/supabase/middleware.ts)) runs on every request (Next.js 16 renamed Middleware → Proxy; functionality unchanged):
   - Refreshes the Supabase session via `getUser()`.
   - Redirects unauthenticated users to `/login` (preserving the intended path in `?next=...`).
   - Redirects authenticated users away from `/login` back to `/`.
2. **Login** ([`app/login/page.tsx`](app/login/page.tsx)) renders the [`LoginForm`](components/organisms/LoginForm.tsx) organism. Submission calls the `signIn` Server Action.
3. **Sign-up** ([`app/signup/page.tsx`](app/signup/page.tsx)) renders the [`SignUpForm`](components/organisms/SignUpForm.tsx). The `signUp` action calls `supabase.auth.signUp` with `emailRedirectTo: <NEXT_PUBLIC_SITE_URL>/auth/callback`. If your Supabase project has email confirmation **off** (Dashboard → Authentication → Providers → Email → "Confirm email" off), the user is signed in immediately and redirected to `/`. Otherwise they get an inline "check your email" message; the confirmation link lands on [`app/auth/callback/route.ts`](app/auth/callback/route.ts), which exchanges the code for a session and redirects to `/`.
4. **Home** ([`app/page.tsx`](app/page.tsx)) double-checks `user` (defense in depth) and renders the user's todos. The [`SignOutButton`](components/organisms/SignOutButton.tsx) calls `signOut`.

---

## Adding a new migration

1. Create the next-numbered file under `supabase/migrations/`, e.g. `0002_add_column.sql`.
2. Apply via Dashboard SQL Editor or `supabase db push`.
3. Every table in `public` **must** have RLS enabled and explicit policies — see [`0001_create_todos.sql`](supabase/migrations/0001_create_todos.sql) for the owner-only pattern.

---

## Design system

[DESIGN.md](DESIGN.md) holds the design tokens (colors, typography, spacing, rounded, components). The tokens are registered as Tailwind v4 theme variables in [`app/globals.css`](app/globals.css):

| DESIGN.md key | Tailwind utility |
|---|---|
| `colors.primary` | `bg-primary`, `text-primary` |
| `colors.ink`, `canvas`, `canvas-parchment`, `surface-tile-*` | `bg-*`, `text-*` |
| `spacing.{xxs..section}` | `p-xxs` … `p-section`, `gap-lg`, `m-*` |
| `rounded.{xs,sm,md,lg,pill}` | `rounded-xs` … `rounded-pill` |
| `typography.{hero-display,display-lg,body,body-strong,caption,…}` | `text-hero-display`, `text-body`, … (size + line-height + weight + tracking + family in one class) |
| Product shadow | `shadow-product` (use only on product imagery — DESIGN.md rule) |

---

## Internationalization

The app ships **English** and **Vietnamese**. On first visit, the locale is auto-detected from the browser's `Accept-Language` header; afterwards it's persisted in a `locale` cookie. The fixed-position switcher (bottom-right corner) toggles between the two.

Add or edit strings in [`lib/i18n/dictionaries.ts`](lib/i18n/dictionaries.ts). See [docs/core-principles-and-coding-standards/coding-conventions.md#internationalization-i18n](docs/core-principles-and-coding-standards/coding-conventions.md#internationalization-i18n) for usage patterns and how to add a new locale.

---

## Verification (before committing)

```bash
yarn lint     # must pass with no errors
yarn build    # must succeed (catches type errors)
yarn dev      # for UI changes: verify on http://localhost:3002
```

See [docs/operation.md](docs/operation.md) for the no-bypass rules.
