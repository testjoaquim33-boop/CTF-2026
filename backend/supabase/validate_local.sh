#!/usr/bin/env bash
# Validate migrations + seed against a throwaway local Postgres.
# Mirrors Supabase by stubbing schema `auth`, auth.uid(), and the roles
# authenticated / anon / service_role. For LOCAL VALIDATION ONLY — Supabase
# provides these in the real project.
set -euo pipefail
HOST="${PGHOST:-/tmp}"; PORT="${PGPORT:-5433}"; DB="pf_validate"
PSQL="psql -h $HOST -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$PSQL -c "drop database if exists $DB;" -c "create database $DB;"
$PSQL -d $DB -c "
  create schema if not exists auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create or replace function auth.uid() returns uuid language sql stable
    as \$\$ select nullif(current_setting('app.uid', true), '')::uuid \$\$;
  do \$\$ begin
    if not exists (select from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists (select from pg_roles where rolname='anon') then create role anon; end if;
    if not exists (select from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
  end \$\$;"
DIR="$(cd "$(dirname "$0")" && pwd)"
$PSQL -d $DB -f "$DIR/migrations/0001_init_schema.sql"
$PSQL -d $DB -f "$DIR/migrations/0002_rls_policies.sql"
$PSQL -d $DB -c "grant usage on schema public to authenticated;
                 grant select,insert,update,delete on all tables in schema public to authenticated;"
$PSQL -d $DB -f "$DIR/seed/0001_seed_core.sql"
$PSQL -d $DB -f "$DIR/seed/0002_seed_exercises.sql"
echo "OK: migrations + seed applied. Exercises: $($PSQL -d $DB -t -c 'select count(*) from exercises;')"
