#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  DATABASE_URL
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET
  R2_ENDPOINT
  BACKUP_KEY
)

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required environment variable: $var" >&2
    exit 1
  fi
done

if [[ "${CONFIRM_PRODUCTION_RESTORE:-}" != "I_UNDERSTAND_THIS_REPLACES_PRODUCTION_DATA" ]]; then
  echo "Refusing to restore without explicit confirmation." >&2
  echo "Set CONFIRM_PRODUCTION_RESTORE=I_UNDERSTAND_THIS_REPLACES_PRODUCTION_DATA" >&2
  exit 1
fi

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

local_path="/tmp/restore.dump"

echo "Downloading backup from R2: s3://${R2_BUCKET}/${BACKUP_KEY}"

aws s3 cp "s3://${R2_BUCKET}/${BACKUP_KEY}" "$local_path" \
  --endpoint-url "$R2_ENDPOINT"

echo "Restoring backup into DATABASE_URL target."
echo "This will clean and replace database objects from the dump."

pg_restore \
  --dbname "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --single-transaction \
  "$local_path"

echo "Restore completed."

echo "Verifying restored database."

psql "$DATABASE_URL" -c "\dt"
psql "$DATABASE_URL" -c "select count(*) as users from \"User\";"
psql "$DATABASE_URL" -c "select count(*) as bookings from \"Booking\";"
psql "$DATABASE_URL" -c "select migration_name, finished_at from \"_prisma_migrations\" order by finished_at desc limit 5;"

rm -f "$local_path"

echo "Restore verification completed."