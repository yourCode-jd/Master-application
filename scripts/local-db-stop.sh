#!/usr/bin/env sh
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
"/usr/lib/postgresql/14/bin/pg_ctl" -D "$PROJECT_DIR/.postgres-data" stop -m fast
