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
  start              yarn dev (http://localhost:3002)
  build              next build
  prod               yarn build && yarn start
  lint               yarn lint
  typecheck          yarn typecheck (tsc --noEmit)
  verify             yarn lint && yarn typecheck

Database (Postgres in Docker + Drizzle):
  db                 Start the Postgres container (localhost:5450, user/db = postgres/zen).
  db:stop            Stop the Postgres container.
  generate           Generate SQL migrations from db/schema.ts (drizzle-kit generate).
  migrate            Apply pending migrations (drizzle-kit migrate).
  seed               Run db/seed.ts (tsx).

Deployment:
  deploy             Build and run the full stack (app + db) via Docker Compose.

  help               Show this message.
EOF
}

cmd_start()     { yarn dev; }
cmd_build()     { yarn build; }
cmd_prod()      { yarn build && yarn start; }
cmd_lint()      { yarn lint; }
cmd_typecheck() { yarn typecheck; }
cmd_verify()    { yarn verify; }

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
  echo "App:      http://localhost:3002"
  echo "Postgres: localhost:5450"
}

case "$CMD" in
  start|dev)      cmd_start ;;
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
  help|-h|--help) cmd_help ;;
  *)
    echo "Unknown command: $CMD" >&2
    echo >&2
    cmd_help >&2
    exit 1
    ;;
esac
