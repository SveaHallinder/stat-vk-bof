#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_DIR="$(cd "$BACKEND_DIR/.." && pwd)"

sql_file() {
  local name="$1"
  if [[ -f "$BACKEND_DIR/$name" ]]; then
    printf '%s\n' "$BACKEND_DIR/$name"
    return 0
  fi

  if [[ -f "$REPO_DIR/$name" ]]; then
    printf '%s\n' "$REPO_DIR/$name"
    return 0
  fi

  printf 'Missing migration file: %s\n' "$name" >&2
  return 1
}

psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" || true

# 1) Create base schema (tables) if missing
psql "$DATABASE_URL" -f "$(sql_file create_base_schema.sql)"

# 2) Add/align optional columns (idempotent)
psql "$DATABASE_URL" -f "$(sql_file add_refresh_token_column.sql)"

# 3) Audit log table and cleanup function (requires handlers)
psql "$DATABASE_URL" -f "$(sql_file create_audit_log_table.sql)"

# 4) Ensure customers.is_protected exists
psql "$DATABASE_URL" -f "$(sql_file add_is_protected_column.sql)"

# 5) Update invites table, view and indexes (requires invites & handlers)
psql "$DATABASE_URL" -f "$(sql_file fix_invites_table.sql)"

# 6) Create performance indexes
psql "$DATABASE_URL" -f "$(sql_file create_indexes.sql)"
echo "Migration OK"
