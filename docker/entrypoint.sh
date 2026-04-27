#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required, for example: postgresql://user:password@host:5432/jobs_db?schema=public"
  exit 1
fi

export API_PORT="${API_PORT:-3001}"
export WEB_PORT="${WEB_PORT:-3000}"
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:${API_PORT}}"
export NEXT_PUBLIC_API_BASE_URL="${NEXT_PUBLIC_API_BASE_URL:-/api}"
export WEB_ORIGIN="${WEB_ORIGIN:-http://localhost:${WEB_PORT}}"

db_setup_mode="${DB_SETUP_MODE:-push}"

case "$db_setup_mode" in
  push)
    db_setup_script="db:push"
    ;;
  migrate)
    db_setup_script="db:migrate"
    ;;
  none | false | 0)
    db_setup_script=""
    ;;
  *)
    echo "Unsupported DB_SETUP_MODE: ${db_setup_mode}. Use push, migrate, or none."
    exit 1
    ;;
esac

if [ -n "$db_setup_script" ]; then
  attempts=1
  max_attempts="${DB_SETUP_RETRIES:-10}"
  delay_seconds="${DB_SETUP_RETRY_DELAY_SECONDS:-3}"

  until pnpm --filter @job-pipeline/db "$db_setup_script"; do
    if [ "$attempts" -ge "$max_attempts" ]; then
      echo "Database setup failed after ${attempts} attempts."
      exit 1
    fi

    attempts=$((attempts + 1))
    echo "Database is not ready yet. Retrying setup in ${delay_seconds}s..."
    sleep "$delay_seconds"
  done
fi

node apps/api/dist/index.js &
api_pid=$!

pnpm --filter @job-pipeline/web start &
web_pid=$!

shutdown() {
  kill -TERM "$api_pid" "$web_pid" 2>/dev/null || true
  wait "$api_pid" 2>/dev/null || true
  wait "$web_pid" 2>/dev/null || true
}

trap 'shutdown; exit 143' INT TERM

while true; do
  if ! kill -0 "$api_pid" 2>/dev/null; then
    set +e
    wait "$api_pid"
    status=$?
    shutdown
    exit "$status"
  fi

  if ! kill -0 "$web_pid" 2>/dev/null; then
    set +e
    wait "$web_pid"
    status=$?
    shutdown
    exit "$status"
  fi

  sleep 1
done
