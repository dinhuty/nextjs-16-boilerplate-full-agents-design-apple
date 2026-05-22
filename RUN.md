# RUN.md — Project task runner

`run.sh` is the single entry point for common project tasks. It wraps `yarn` and the Supabase CLI so the same command name works locally and in CI.

> See [README.md](README.md) for project overview and first-time setup; [AGENTS.md](AGENTS.md) for the AI-agent rules; [docs/operation.md](docs/operation.md) for the no-bypass rules.

---

## Setup (one-time)

```bash
chmod +x run.sh
```

After that you can invoke it as `./run.sh <command>`. Or call it without the bit set as `bash run.sh <command>` — both work.

---

## Commands

```
bash run.sh <command> [args...]
```

### App lifecycle

| Command | What it does | Equivalent |
|---|---|---|
| `start` (or `dev`) | Start the Next.js dev server with Turbopack on `http://localhost:3002`. | `yarn dev` |
| `build` | Production build + TypeScript type-check. | `yarn build` |
| `prod` | Build then run the production server on `http://localhost:3002`. | `yarn build && yarn start` |
| `lint` | ESLint (flat config). | `yarn lint` |
| `typecheck` | TypeScript only (no build artifact). Faster than `build` when you just want type errors. | `yarn typecheck` (`tsc --noEmit`) |
| `verify` | Lint + typecheck. The minimum CI check before merging. | `yarn verify` |

### Database (Supabase)

Requires the **Supabase CLI** for `link` / `migrate` / `migration:new`. Install: `brew install supabase/tap/supabase` (macOS) or see https://supabase.com/docs/guides/cli.

| Command | What it does |
|---|---|
| `login` | **One-time** — authenticate the Supabase CLI. Opens browser → "Generate Token" → CLI stores it at `~/.supabase/access-token`. Required before `link`. |
| `link <project-ref>` | **One-time** — associate this repo with your Supabase project. Required before `migrate`. Find your project ref at **Dashboard → Project Settings → General** or in the subdomain of `NEXT_PUBLIC_SUPABASE_URL`. |
| `migrate` (or `migration`) | Apply every SQL file in `supabase/migrations/` to the linked Supabase project. Wraps `supabase db push`. Refuses to run if the repo isn't linked. |
| `migration:new <name>` | Generate a new timestamped migration file. Wraps `supabase migration new <name>`. |
| `seed` | Apply `supabase/seed.sql`. If `DATABASE_URL` is set in `.env.local`, runs `psql` automatically. Otherwise prints instructions for the Dashboard SQL Editor. |

### Deployment

| Command | What it does |
|---|---|
| `deploy` | **Placeholder.** Currently runs `yarn build && yarn start` (local production server). Edit `cmd_deploy()` in `run.sh` once you pick a host (Vercel / Netlify / Docker / etc.). |

### Help

| Command | What it does |
|---|---|
| `help` (or no argument) | Print usage. |

---

## Examples

```bash
# Day-to-day
bash run.sh start                       # http://localhost:3002
bash run.sh verify                      # before pushing

# Database — one-time setup (per machine, then per repo clone)
bash run.sh login                       # opens browser; saves token at ~/.supabase/access-token
bash run.sh link abcxyz123              # project ref from Supabase dashboard

# Day-to-day
bash run.sh migration:new add_users_table
# → supabase/migrations/<timestamp>_add_users_table.sql is created.
bash run.sh migrate                     # apply pending migrations
bash run.sh seed                        # apply supabase/seed.sql

# Production smoke test locally
bash run.sh prod                        # build + start
```

---

## When to use `run.sh` vs `yarn` directly

| Situation | Use |
|---|---|
| You want a stable cross-machine command (CI, README, onboarding) | `bash run.sh <cmd>` |
| You want shell shortcuts your editor recognizes | `yarn <script>` |
| You need passthrough flags Next.js / Supabase expects | Either — both forward extra arguments |

The package.json scripts (`yarn dev`, `yarn build`, `yarn typecheck`, `yarn db:push`, …) and `run.sh` mostly overlap. `run.sh` adds the multi-step / conditional commands (`seed` falls back to Dashboard instructions; `deploy` is a single named entry point).

---

## Extending `run.sh`

To add a new command, edit `run.sh`:

1. Implement `cmd_<name>()` near the other `cmd_*` functions.
2. Register it in the `case "$CMD" in … esac` block at the bottom.
3. Add a row in `cmd_help()` so `bash run.sh help` lists it.
4. If users will run it often, also expose it via `package.json` scripts as `"<name>": "bash run.sh <name>"`.

Keep `run.sh` POSIX-`bash`-compatible (set `-euo pipefail`, no zsh-only syntax) so CI environments without zsh still work.
