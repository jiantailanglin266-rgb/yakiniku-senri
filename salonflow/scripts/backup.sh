#!/usr/bin/env bash
#
# SalonFlow — database backup
#
# Self-hosting means nobody else is taking backups. This script is the whole
# safety net for a salon's bookings and charts, so it fails loudly rather than
# leaving a truncated file that looks like a backup.
#
# Usage:
#   ./scripts/backup.sh                 # uses $DATABASE_URL
#   BACKUP_DIR=/mnt/backups ./scripts/backup.sh
#
# Cron (daily 03:15):
#   15 3 * * * cd /opt/salonflow && ./scripts/backup.sh >> /var/log/salonflow-backup.log 2>&1

set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETAIN_DAILY="${RETAIN_DAILY:-30}"
RETAIN_MONTHLY="${RETAIN_MONTHLY:-12}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  # Fall back to .env so cron does not need the variable exported.
  if [[ -f .env ]]; then
    # shellcheck disable=SC2046
    export $(grep -E '^(DATABASE_URL|DIRECT_DATABASE_URL)=' .env | sed 's/#.*//' | xargs -d '\n' 2>/dev/null || true)
  fi
fi

# Migrations and dumps both want the unpooled endpoint.
DUMP_URL="${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}"

if [[ -z "$DUMP_URL" ]]; then
  echo "ERROR: DATABASE_URL / DIRECT_DATABASE_URL が設定されていません" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR/daily" "$BACKUP_DIR/monthly"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
TARGET="$BACKUP_DIR/daily/salonflow-$STAMP.dump"
TMP="$TARGET.partial"

echo "[$(date -u +%FT%TZ)] backup start -> $TARGET"

# Write to a .partial name and rename only on success. A cron job killed
# halfway through must not leave a file that a future restore would trust.
pg_dump --format=custom --no-owner --no-acl --file="$TMP" "$DUMP_URL"
mv "$TMP" "$TARGET"

SIZE="$(du -h "$TARGET" | cut -f1)"
echo "[$(date -u +%FT%TZ)] backup ok ($SIZE)"

# A dump that restores nothing is worse than no dump, because it produces
# false confidence. Verify the archive is readable and contains the tables
# whose loss would end the business.
if ! pg_restore --list "$TARGET" > /tmp/salonflow-toc.$$ 2>/dev/null; then
  echo "ERROR: ダンプが読み取れません。バックアップは信頼できません。" >&2
  rm -f /tmp/salonflow-toc.$$
  exit 1
fi

for table in Appointment Customer MedicalRecord AppointmentStaff; do
  if ! grep -q "TABLE DATA public $table" /tmp/salonflow-toc.$$; then
    echo "ERROR: ダンプに $table が含まれていません。" >&2
    rm -f /tmp/salonflow-toc.$$
    exit 1
  fi
done
rm -f /tmp/salonflow-toc.$$
echo "[$(date -u +%FT%TZ)] verify ok"

# Keep the first backup of each month indefinitely (up to RETAIN_MONTHLY).
DAY_OF_MONTH="$(date -u +%d)"
if [[ "$DAY_OF_MONTH" == "01" ]]; then
  cp "$TARGET" "$BACKUP_DIR/monthly/salonflow-$(date -u +%Y%m).dump"
  echo "[$(date -u +%FT%TZ)] monthly copy kept"
fi

# Prune by count rather than by age: if the job stops running for two months,
# age-based pruning would delete every backup that still exists.
prune() {
  local dir="$1" keep="$2"
  local files
  mapfile -t files < <(ls -1t "$dir"/*.dump 2>/dev/null || true)
  if (( ${#files[@]} > keep )); then
    for file in "${files[@]:$keep}"; do
      rm -f "$file"
      echo "[$(date -u +%FT%TZ)] pruned $(basename "$file")"
    done
  fi
}

prune "$BACKUP_DIR/daily" "$RETAIN_DAILY"
prune "$BACKUP_DIR/monthly" "$RETAIN_MONTHLY"

echo "[$(date -u +%FT%TZ)] done. daily=$(ls -1 "$BACKUP_DIR/daily" | wc -l) monthly=$(ls -1 "$BACKUP_DIR/monthly" | wc -l)"
echo ""
echo "注意: このバックアップはサーバー内にあります。サーバーごと失われたら"
echo "      復旧できません。別の場所へ複製してください（rclone / scp など）。"
