#!/bin/sh
set -eu

website_pid=""
backoffice_pid=""

stop_children() {
  [ -z "$website_pid" ] || kill "$website_pid" 2>/dev/null || true
  [ -z "$backoffice_pid" ] || kill "$backoffice_pid" 2>/dev/null || true
}

trap stop_children INT TERM EXIT

# A fresh clone has no gitignored package `dist/`; build the shared package
# before either Next.js process tries to resolve it.
cd /workspace
npm run build --workspace=@trackflow/business-logic

(
  cd /workspace/uis/website
  npm run dev -- --hostname 0.0.0.0 --port 3000
) &
website_pid=$!

(
  cd /workspace/uis/backoffice
  npm run dev -- --hostname 0.0.0.0 --port 3001
) &
backoffice_pid=$!

wait -n "$website_pid" "$backoffice_pid"
