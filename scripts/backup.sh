#!/usr/bin/env sh
set -eu

DESTINATION=${1:?Usage: pnpm backup -- /absolute/backup-directory}
STORAGE_ROOT=${UPLOAD_STORAGE_DIR:-"$(pwd)/uploads-private"}
case "$DESTINATION" in /*) ;; *) echo "Backup destination must be an absolute path." >&2; exit 1;; esac
if [ ! -d "$STORAGE_ROOT" ] || [ ! -r "$STORAGE_ROOT" ]; then echo "Upload storage path is missing or unreadable: $STORAGE_ROOT" >&2; exit 1; fi
mkdir -p "$DESTINATION"
if [ -e "$DESTINATION/database.dump" ] || [ -e "$DESTINATION/uploads.tar.gz" ]; then echo "Backup destination already contains a backup; choose an empty directory." >&2; exit 1; fi
# Prisma accepts URL query options (for example ?schema=public) that pg_dump does not.
PG_DATABASE_URL=${DATABASE_URL%%\?*}
pg_dump "$PG_DATABASE_URL" --format=custom --file="$DESTINATION/database.dump"
(cd "$STORAGE_ROOT" && find . -type f -print0 | sort -z | xargs -0 sha256sum) > "$DESTINATION/uploads.sha256"
tar -C "$STORAGE_ROOT" -czf "$DESTINATION/uploads.tar.gz" .
printf '{"storageRoot":"%s","createdAt":"%s"}\n' "$STORAGE_ROOT" "$(date -u +%FT%TZ)" > "$DESTINATION/manifest.json"
echo "Backup complete: $DESTINATION"
