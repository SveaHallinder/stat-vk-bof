#!/usr/bin/env bash
set -euo pipefail
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
psql "$DATABASE_URL" -f "$(dirname "$0")/../create_invites_table.sql"
echo "Migration OK"
