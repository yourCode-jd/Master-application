#!/usr/bin/env sh
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DATA_DIR="$PROJECT_DIR/.postgres-data"
SOCKET_DIR="/tmp/localops-pg-socket"
PG_CTL="/usr/lib/postgresql/14/bin/pg_ctl"

if [ ! -f "$DATA_DIR/PG_VERSION" ]; then
  echo "Missing local database data at $DATA_DIR. Run project setup first." >&2
  exit 1
fi

mkdir -p "$SOCKET_DIR"
if "$PG_CTL" -D "$DATA_DIR" status >/dev/null 2>&1; then
  echo "Local PostgreSQL is already running on port 5433."
else
  "$PG_CTL" -D "$DATA_DIR" -o "-p 5433 -h 127.0.0.1 -k $SOCKET_DIR" -l /tmp/localops-postgres.log start
fi
