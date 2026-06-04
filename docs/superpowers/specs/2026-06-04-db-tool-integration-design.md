# Design: Port acm-tools/database into ad-manager

Date: 2026-06-04
Status: Approved (user said "làm đi")

## Goal

Bring the standalone **acm-tools/database** tool (a SQL runner against MySQL "mall"
databases) into the **ad-manager** Next.js 16 app, with two storage changes:

- **SQL snippets** become **shared master data** stored in Supabase — every
  authenticated user can read, create, edit, and delete them.
- The **target-DB connection config** (host/port/user/password/database) becomes
  **per-user** data stored in Supabase — each user configures their own MySQL.

ad-manager itself keeps using its `.env` Supabase Postgres as the app database.
The actual SQL still runs against each user's configured **MySQL** target.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Integration architecture | **Port everything into ad-manager** — drop NestJS; reimplement with Next.js Server Actions + `mysql2`. One app, one deploy. |
| Dynamic `.sql.ts` builders | **Drop them.** Only static SQL templates with `${param}` placeholders. |
| Password storage | **Plaintext + RLS owner-only.** Used for local test DBs only; encryption is overkill. |
| Connections per user | **One** (upsert keyed by `user_id`). |
| Snippet ownership | **True master data** — any authenticated user may edit/delete any snippet. |
| Seed | **Yes** — seed the 60 existing static `.sql` snippets as initial master data. |

Out of scope (YAGNI): NestJS, JS builders, encryption, `WRITE_DB_ALLOWLIST`,
file-based query audit log, multiple connections per user.

## Data model (Supabase migrations)

### `public.sql_snippets` — shared master data
- `id uuid pk`
- `tab text not null` — category/group (e.g. `cart`, `item`, `pricing`)
- `title text not null`
- `body text not null` — SQL with `${param}` placeholders
- `created_by / updated_by uuid null references auth.users` — nullable so seeds have no author
- `created_at / updated_at timestamptz`
- `unique (tab, title)` — no duplicate title within a tab; enables idempotent seed
- RLS: all `authenticated` users may `select / insert / update / delete`.

Params are **not** stored — the UI extracts `${param}` from `body` at render time.

### `public.db_connections` — per-user target config
- `user_id uuid not null references auth.users (unique)`
- `host text not null`, `port int not null default 3306`
- `db_user text not null`, `password text not null default ''`
- `database text not null`
- `read_only boolean not null default true`
- `updated_at timestamptz`
- RLS: owner-only (`auth.uid() = user_id`) for all operations.

## Server layer (in ad-manager)

- New dependency: `mysql2`.
- `lib/db-tool/mysql.ts` — `runSql(config, statement)` and `testConnection(config)`.
  Ports `splitStatements` + `firstVerb` + `read_only` enforcement (`READ_VERBS`)
  from the old `sql.service.ts`. Opens a per-request connection (local test load
  is low — no per-user pool needed).
- `lib/db-tool/snippets.ts` — `extractParams(body)` (the `${param}` regex) and the
  `applyParams(body, params)` substitution used by the runner.
- Server Actions (mirroring `app/login/actions.ts`), each calling `getUser()` first:
  - `app/db-tool/runner/actions.ts` → `executeSql(statement)`
  - `app/db-tool/settings/actions.ts` → `saveConnection`, `testConnection`
  - `app/db-tool/snippets/actions.ts` → `createSnippet`, `updateSnippet`, `deleteSnippet`

## Routes / UI (App Router, atomic design)

Under `app/db-tool/`:
- `layout.tsx` — sub-nav: Runner / Snippets / Settings.
- `runner/page.tsx` — SQL textarea + Run + results table + read-only badge.
- `snippets/page.tsx` — browse by tab → pick snippet → fill `${param}` form →
  load into runner; plus create / edit / delete (master data CRUD).
- `settings/page.tsx` — connection form + Test connection + Save.

Reuse `Button / Input / Label / FormField`. New organisms: `ConnectionForm`,
`SqlRunner`, `SnippetEditor`. Add `dbtool.*` keys to the i18n dictionaries (en + vi).

Auth is already enforced by `utils/supabase/middleware.ts` (non-public paths
redirect to `/login`), so `app/db-tool/*` is protected automatically.

## Safety

- `read_only` per connection: when true, the server rejects anything other than
  `SELECT / SHOW / DESCRIBE / EXPLAIN / WITH`.
- No `WRITE_DB_ALLOWLIST` and no file audit log (E2E/ops concerns, dropped).
