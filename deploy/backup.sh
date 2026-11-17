#!/bin/sh
# Daily backup for docker-compose.prod.yml. Runs once at start, then every day at 03:00 (shop time):
#   - PostgreSQL dump        -> /backups/checoc-YYYYmmdd-HHMM.dump
#   - uploaded photos (tar)  -> /backups/uploads-YYYYmmdd-HHMM.tar.gz
#   - optional off-site copy of both with rclone (BACKUP_REMOTE, e.g. "offsite:checoc-backups"),
#     so a lost or broken VPS does not take the backups with it.
# Local copies are kept BACKUP_KEEP_DAYS days, off-site copies BACKUP_REMOTE_KEEP_DAYS days.
# Restore: see docs/deploy.md.
set -eu

if [ -n "${BACKUP_REMOTE:-}" ] && ! command -v rclone >/dev/null 2>&1; then
  echo "[backup] installing rclone for off-site copies"
  apk add --no-cache rclone >/dev/null
fi

backup() {
  stamp=$(date +%Y%m%d-%H%M)
  ok=1

  file="/backups/checoc-$stamp.dump"
  if pg_dump --format=custom --file="$file.tmp"; then
    mv "$file.tmp" "$file"
    echo "[backup] wrote $file ($(du -h "$file" | cut -f1))"
  else
    rm -f "$file.tmp"
    echo "[backup] database dump FAILED" >&2
    ok=0
  fi

  if [ -d /uploads ]; then
    photos="/backups/uploads-$stamp.tar.gz"
    if tar -czf "$photos.tmp" -C /uploads .; then
      mv "$photos.tmp" "$photos"
      echo "[backup] wrote $photos ($(du -h "$photos" | cut -f1))"
    else
      rm -f "$photos.tmp"
      echo "[backup] uploads archive FAILED" >&2
      ok=0
    fi
  fi

  find /backups \( -name 'checoc-*.dump' -o -name 'uploads-*.tar.gz' \) -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete

  if [ -n "${BACKUP_REMOTE:-}" ] && [ "$ok" = 1 ]; then
    # Only today's files are sent; older ones are already there
    if rclone copy /backups "$BACKUP_REMOTE" --max-age 24h --include 'checoc-*.dump' --include 'uploads-*.tar.gz'; then
      rclone delete "$BACKUP_REMOTE" --min-age "${BACKUP_REMOTE_KEEP_DAYS:-60}d" || true
      echo "[backup] copied to $BACKUP_REMOTE"
    else
      echo "[backup] off-site copy FAILED" >&2
    fi
  fi
}

backup
while true; do
  now=$(date +%s)
  next=$(date -d "$(date +%Y-%m-%d) 03:00" +%s 2>/dev/null || echo $((now + 86400)))
  [ "$next" -le "$now" ] && next=$((next + 86400))
  sleep $((next - now))
  backup
done
