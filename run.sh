#!/usr/bin/env bash
# run.sh — single entry point for common project tasks.
#
# Usage:
#   bash run.sh <command> [args...]
#   ./run.sh <command> [args...]      (after `chmod +x run.sh`)
#
# Commands: start, build, prod, lint, typecheck, verify,
#           migrate, migration:new, seed, deploy, help
#
# Designed to wrap yarn and the Supabase CLI so the same task name
# works locally and in CI.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

CMD="${1:-help}"
shift || true

require_supabase_cli() {
  if ! command -v supabase >/dev/null 2>&1; then
    cat <<'MSG' >&2
Error: Supabase CLI not found on PATH.

Install (macOS):     brew install supabase/tap/supabase
Install (other):     https://supabase.com/docs/guides/cli

Or apply the SQL by hand in the Supabase Dashboard → SQL Editor.
MSG
    exit 1
  fi
}

load_env_local() {
  # Best-effort: export vars from .env.local so subprocesses (psql, etc.) see them.
  if [[ -f ".env.local" ]]; then
    set -a
    # shellcheck disable=SC1091
    source ./.env.local
    set +a
  fi
}

cmd_help() {
  cat <<'EOF'
Usage: bash run.sh <command> [args...]

App lifecycle:
  start              yarn dev (http://localhost:3002)
  build              Production build + type-check
  prod               yarn build && yarn start (http://localhost:3002)
  lint               yarn lint
  typecheck          yarn typecheck (tsc --noEmit)
  verify             yarn lint && yarn typecheck

Database (Supabase, requires Supabase CLI):
  login              One-time: authenticate the Supabase CLI (opens browser).
                     Sets a personal access token in ~/.supabase/access-token.
  link REF           One-time: link this repo to a Supabase project. REF is the
                     project ref from the dashboard URL or NEXT_PUBLIC_SUPABASE_URL.
                     Requires `login` first.
  migrate            Apply all SQL files in supabase/migrations/ to the linked
                     project (must run `link` first).
  migration:new NAME Create a new migration file under supabase/migrations/.
  seed               Apply supabase/seed.sql. If DATABASE_URL is set in .env.local,
                     runs psql automatically. Otherwise prints Dashboard instructions.

Deployment:
  deploy             Placeholder. Configure for your host (Vercel / Netlify / Docker / etc.)
                     — currently runs a local production server as a fallback.

  help               Show this message.
EOF
}

cmd_start() {
  yarn dev
}

cmd_build() {
  yarn build
}

cmd_prod() {
  yarn build
  yarn start
}

cmd_lint() {
  yarn lint
}

cmd_typecheck() {
  yarn typecheck
}

cmd_verify() {
  yarn verify
}

supabase_is_linked() {
  [[ -f "supabase/.temp/project-ref" ]] || [[ -f ".supabase/project-ref" ]]
}

cmd_login() {
  require_supabase_cli
  supabase login
}

cmd_link() {
  require_supabase_cli
  local ref="${1:-}"
  if [[ -z "$ref" ]]; then
    echo "Usage: bash run.sh link <project-ref>" >&2
    echo "Find your project ref at: https://supabase.com/dashboard/project/_/settings/general" >&2
    exit 1
  fi
  if ! supabase link --project-ref "$ref"; then
    cat <<'MSG' >&2

Hint: If the error mentions "Access token not provided", authenticate first:

  bash run.sh login

Or set SUPABASE_ACCESS_TOKEN from https://supabase.com/dashboard/account/tokens
MSG
    exit 1
  fi
}

cmd_migrate() {
  require_supabase_cli
  if ! supabase_is_linked; then
    cat <<'MSG' >&2
Error: Supabase project is not linked. Run this once first:

  bash run.sh link <project-ref>

Find your project ref at:
  https://supabase.com/dashboard/project/_/settings/general
  (or it's the subdomain of your NEXT_PUBLIC_SUPABASE_URL)
MSG
    exit 1
  fi
  echo "→ supabase db push"
  supabase db push "$@"
}

cmd_migration_new() {
  require_supabase_cli
  local name="${1:-}"
  if [[ -z "$name" ]]; then
    echo "Usage: bash run.sh migration:new <name>" >&2
    exit 1
  fi
  supabase migration new "$name"
}

cmd_seed() {
  if [[ ! -f "supabase/seed.sql" ]]; then
    echo "supabase/seed.sql not found." >&2
    exit 1
  fi
  load_env_local
  if [[ -n "${DATABASE_URL:-}" ]]; then
    if ! command -v psql >/dev/null 2>&1; then
      echo "DATABASE_URL is set but psql is not installed. Install with: brew install libpq" >&2
      exit 1
    fi
    echo "→ psql \$DATABASE_URL -f supabase/seed.sql"
    psql "$DATABASE_URL" -f supabase/seed.sql
  else
    cat <<'MSG'
No DATABASE_URL in .env.local — apply seed via Dashboard:

  1. Open Supabase Dashboard → SQL Editor → New query
  2. Paste the contents of supabase/seed.sql
  3. Replace <USER_UUID> placeholder(s) with a real auth user id
  4. Click Run

To enable this command's automatic mode, add to .env.local:
  DATABASE_URL=postgresql://postgres:<password>@db.<ref>.supabase.co:5432/postgres
(Dashboard → Project Settings → Database → Connection string)
MSG
  fi
}

cmd_deploy() {
  cat <<'MSG'
[deploy] No deploy configured yet. Suggested options:

  • Vercel:   npx vercel --prod
  • Docker:   docker build -t ad-manager . && docker run -p 3002:3002 ad-manager
  • Manual:   bash run.sh prod (local production server)

Edit run.sh → cmd_deploy() once you pick a host.
MSG
  # Fall back to local production server so the command does *something* useful.
  yarn build
  yarn start
}

case "$CMD" in
  start|dev)         cmd_start ;;
  build)             cmd_build ;;
  prod)              cmd_prod ;;
  lint)              cmd_lint ;;
  typecheck)         cmd_typecheck ;;
  verify)            cmd_verify ;;
  login)             cmd_login ;;
  link)              cmd_link "$@" ;;
  migrate|migration) cmd_migrate "$@" ;;
  migration:new)     cmd_migration_new "$@" ;;
  seed)              cmd_seed ;;
  deploy)            cmd_deploy ;;
  help|-h|--help)    cmd_help ;;
  *)
    echo "Unknown command: $CMD" >&2
    echo >&2
    cmd_help >&2
    exit 1
    ;;
esac
