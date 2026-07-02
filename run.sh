#!/usr/bin/env bash
# run.sh — single entry point for common project tasks.
#
# Usage:
#   bash run.sh <command> [args...]
#   ./run.sh <command> [args...]      (after `chmod +x run.sh`)
#
# Wraps yarn, Docker Compose, and Drizzle so the same task name works
# locally and in CI.

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

CMD="${1:-help}"
shift || true

load_env_local() {
  # Export vars from .env.local so drizzle-kit / tsx see DATABASE_URL.
  if [[ -f ".env.local" ]]; then
    set -a
    # shellcheck disable=SC1091
    source ./.env.local
    set +a
  fi
}

require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Error: Docker not found on PATH." >&2
    echo "Install Docker Desktop: https://docs.docker.com/get-docker/" >&2
    exit 1
  fi
}

cmd_help() {
  cat <<'EOF'
Usage: bash run.sh <command> [args...]

App lifecycle:
  start              yarn dev on the HOST (http://localhost:3021)
  build              next build
  prod               yarn build && yarn start
  lint               yarn lint
  typecheck          yarn typecheck (tsc --noEmit)
  verify             yarn lint && yarn typecheck

Dev in Docker (hot reload, source bind-mounted):
  up [-d]            Run app (yarn dev) + db in Docker with live reload. No rebuild on code change.
  up:build           Same as `up` but rebuild the dev image first (after Dockerfile changes).
  down [-v]          Stop the dev stack (add -v to also drop node_modules/.next/db volumes).

Database (Postgres in Docker + Drizzle):
  db                 Start the Postgres container (localhost:5450, user/db = postgres/zen).
  db:stop            Stop the Postgres container.
  generate           Generate SQL migrations from db/schema.ts (drizzle-kit generate).
  migrate            Apply pending migrations (drizzle-kit migrate).
  seed               Run db/seed.ts (tsx).

Deployment:
  deploy             Build and run the full stack (app + db) locally via Docker Compose.
  deploy-prd [branch]  Copy .env.production -> server .env, then git pull (default: main)
                     + rebuild the stack. Reads SSH_SERVER/USER/PASSWORD from .env (needs sshpass).

  help               Show this message.
EOF
}

cmd_start()     { yarn dev; }
cmd_build()     { yarn build; }
cmd_prod()      { yarn build && yarn start; }
cmd_lint()      { yarn lint; }
cmd_typecheck() { yarn typecheck; }
cmd_verify()    { yarn verify; }

DEV_FILES=(-f docker-compose.yml -f docker-compose.dev.yml)

cmd_up() {
  require_docker
  docker compose "${DEV_FILES[@]}" up "$@"
}

cmd_up_build() {
  require_docker
  docker compose "${DEV_FILES[@]}" up --build "$@"
}

cmd_down() {
  require_docker
  docker compose "${DEV_FILES[@]}" down "$@"
}

cmd_db() {
  require_docker
  docker compose up -d db
  echo "Postgres starting on localhost:5450 (user=postgres db=zen)."
}

cmd_db_stop() {
  require_docker
  docker compose stop db
}

cmd_generate() {
  load_env_local
  yarn db:generate
}

cmd_migrate() {
  load_env_local
  yarn db:migrate
}

cmd_seed() {
  load_env_local
  yarn db:seed
}

cmd_deploy() {
  require_docker
  echo "→ docker compose up -d --build"
  docker compose up -d --build
  echo "App:      http://localhost:3021"
  echo "Postgres: localhost:5450"
}

# Read a single KEY=VALUE from .env without sourcing it (the file may contain
# non KEY=VALUE lines that `source` would try to execute).
read_env_var() {
  local key="$1"
  # Strip only a MATCHED wrapping quote pair (keep genuine boundary quotes).
  # Trailing `|| true`: a missing key makes grep exit 1, which would abort the
  # script under `set -o pipefail` before callers can check for an empty value.
  grep -E "^${key}=" .env 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r' \
    | sed -E -e 's/^"(.*)"$/\1/' -e "s/^'(.*)'\$/\1/" || true
}

# Production deploy target on the server (relative to the SSH user's home).
REMOTE_DIR="acm-tool"

cmd_deploy_prd() {
  local branch="${1:-main}"
  local env_prod=".env.production"

  [[ -f "$env_prod" ]] || { echo "Error: $env_prod not found (create it on your machine)." >&2; exit 1; }
  command -v sshpass >/dev/null 2>&1 || { echo "Error: sshpass not installed (macOS: brew install hudochenkov/sshpass/sshpass)." >&2; exit 1; }

  local ssh_host ssh_user ssh_pass
  ssh_host="$(read_env_var SSH_SERVER)"
  ssh_user="$(read_env_var SSH_USER)"
  ssh_pass="$(read_env_var SSH_PASSWORD)"
  [[ -n "$ssh_host" && -n "$ssh_user" && -n "$ssh_pass" ]] \
    || { echo "Error: set SSH_SERVER / SSH_USER / SSH_PASSWORD in .env." >&2; exit 1; }

  # sshpass reads the password from SSHPASS (-e) so it never shows up in `ps`.
  export SSHPASS="$ssh_pass"

  echo "→ Copying $env_prod → server ~/$REMOTE_DIR/.env…"
  sshpass -e scp -o StrictHostKeyChecking=accept-new "$env_prod" "$ssh_user@$ssh_host:$REMOTE_DIR/.env"

  echo "→ git pull ($branch) + rebuild on the server…"
  sshpass -e ssh -o StrictHostKeyChecking=accept-new "$ssh_user@$ssh_host" \
    "set -e; cd \"$REMOTE_DIR\" && git fetch origin && git checkout -f -B \"$branch\" \"origin/$branch\" && docker compose up -d --build && docker compose ps"

  unset SSHPASS
  echo "Done. App: http://$ssh_host:${APP_PORT:-3021} · Postgres: $ssh_host:${DB_PORT:-5450}"
}

case "$CMD" in
  start|dev)      cmd_start ;;
  up)             cmd_up "$@" ;;
  up:build)       cmd_up_build "$@" ;;
  down)           cmd_down "$@" ;;
  build)          cmd_build ;;
  prod)           cmd_prod ;;
  lint)           cmd_lint ;;
  typecheck)      cmd_typecheck ;;
  verify)         cmd_verify ;;
  db)             cmd_db ;;
  db:stop)        cmd_db_stop ;;
  generate)       cmd_generate ;;
  migrate)        cmd_migrate ;;
  seed)           cmd_seed ;;
  deploy)         cmd_deploy ;;
  deploy-prd)     cmd_deploy_prd "$@" ;;
  help|-h|--help) cmd_help ;;
  *)
    echo "Unknown command: $CMD" >&2
    echo >&2
    cmd_help >&2
    exit 1
    ;;
esac
