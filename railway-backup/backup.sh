#!/usr/bin/env bash
set -euo pipefail

required_vars=(
  DATABASE_URL
  R2_ACCESS_KEY_ID
  R2_SECRET_ACCESS_KEY
  R2_BUCKET
  R2_ENDPOINT
)

 for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "Missing required environment variable: $var" >&2
    exit 1
  fi
done

BACKUP_PREFIX="${BACKUP_PREFIX:-prod/postgres}"
ROLLING_BACKUP_KEEP="${ROLLING_BACKUP_KEEP:-10}"

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

timestamp="$(date -u +"%Y-%m-%dT%H-%M-%SZ")"
filename="erics-barbers-prod-${timestamp}.dump"
local_path="/tmp/${filename}"
object_key="${BACKUP_PREFIX}/${filename}"

echo "Creating Postgres backup: ${filename}"

pg_dump "$DATABASE_URL" \
  --format=custom \
  --no-owner \
  --no-acl \
  --file "$local_path"

echo "Uploading backup to R2: s3://${R2_BUCKET}/${object_key}"

aws s3 cp "$local_path" "s3://${R2_BUCKET}/${object_key}" \
  --endpoint-url "$R2_ENDPOINT"

echo "Backup uploaded successfully."

echo "Cleaning up local backup file."
rm -f "$local_path"

echo "Backup complete: ${object_key}"

echo "Applying rolling retention: keeping latest ${ROLLING_BACKUP_KEEP} backup(s)."

old_keys="$(
  aws s3api list-objects-v2 \
    --bucket "$R2_BUCKET" \
    --prefix "${BACKUP_PREFIX}/" \
    --endpoint-url "$R2_ENDPOINT" \
    --query "sort_by(Contents || \`[]\`, &LastModified)[:-\`${ROLLING_BACKUP_KEEP}\`].Key" \
    --output text
)"

if [[ -n "$old_keys" && "$old_keys" != "None" ]]; then
  for key in $old_keys; do
    echo "Deleting old backup: ${key}"
    aws s3 rm "s3://${R2_BUCKET}/${key}" \
      --endpoint-url "$R2_ENDPOINT"
  done
else
  echo "No old backups to delete."
fi