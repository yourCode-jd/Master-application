#!/usr/bin/env sh
set -eu

BACKUP_DIR=${1:?Usage: pnpm restore:uploads -- /absolute/backup-directory /absolute/empty-target [--overwrite]}
TARGET=${2:?Usage: pnpm restore:uploads -- /absolute/backup-directory /absolute/empty-target [--overwrite]}
OVERWRITE=${3:-}
case "$BACKUP_DIR:$TARGET" in /*:/*) ;; *) echo "Backup and restore paths must be absolute." >&2; exit 1;; esac
for file in "$BACKUP_DIR/uploads.tar.gz" "$BACKUP_DIR/uploads.sha256" "$BACKUP_DIR/manifest.json"; do [ -r "$file" ] || { echo "Missing or unreadable backup file: $file" >&2; exit 1; }; done
if tar -tzf "$BACKUP_DIR/uploads.tar.gz" | grep -E '(^/|(^|/)\.\.(/|$))' >/dev/null; then echo "Unsafe archive path." >&2; exit 1; fi
if [ -e "$TARGET" ] && [ "$(find "$TARGET" -mindepth 1 -print -quit 2>/dev/null)" ] && [ "$OVERWRITE" != "--overwrite" ]; then echo "Restore target is not empty; use an empty target or explicit --overwrite." >&2; exit 1; fi
mkdir -p "$TARGET"
tar -xzf "$BACKUP_DIR/uploads.tar.gz" -C "$TARGET"
(cd "$TARGET" && sha256sum -c "$BACKUP_DIR/uploads.sha256")
find "$TARGET" -type f -readable | wc -l | xargs echo "Restored readable files:"
