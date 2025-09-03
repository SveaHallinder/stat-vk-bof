#!/usr/bin/env bash
set -euo pipefail
psql "$DATABASE_URL" -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;" || true
# Uppdatera invites-tabell och index
psql "$DATABASE_URL" -f "$(dirname "$0")/../fix_invites_table.sql"
# Lägg till refresh_token-kolumn
psql "$DATABASE_URL" -f "$(dirname "$0")/../add_refresh_token_column.sql"
# Skapa audit_log och cleanup-funktion (idempotent)
psql "$DATABASE_URL" -f "$(dirname "$0")/../create_audit_log_table.sql"
echo "Migration OK"
