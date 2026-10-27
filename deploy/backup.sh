#!/bin/sh
# Daily PostgreSQL dump for docker-compose.prod.yml. Runs once at start, then every day at 03:00
# (shop time). Restore: see docs/deploy.md.
set -eu

backup() {
  file="/backups/checoc-$(date +%Y%m%d-%H%M).dump"
  if pg_dump --format=custom --file="$file.tmp"; then
    mv "$file.tmp" "$file"
    echo "[backup] wrote $file ($(du -h "$file" | cut -f1))"
  else
    rm -f "$file.tmp"
    echo "[backup] FAILED" >&2
  fi
  find /backups -name 'checoc-*.dump' -mtime +"${BACKUP_KEEP_DAYS:-14}" -delete
}

backup
while true; do
  now=$(date +%s)
  next=$(date -d "$(date +%Y-%m-%d) 03:00" +%s 2>/dev/null || echo $((now + 86400)))
  [ "$next" -le "$now" ] && next=$((next + 86400))
  sleep $((next - now))
  backup
done
