-- 0003_create_db_connections.sql
-- Per-user target MySQL connection config for the DB tool. One row per user.
-- RLS limits read / write to the owner. Password is stored in plaintext — this
-- tool targets local test databases only (see design doc 2026-06-04).

create table if not exists public.db_connections (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  host        text not null,
  port        integer not null default 3306,
  db_user     text not null,
  password    text not null default '',
  database    text not null,
  read_only   boolean not null default true,
  updated_at  timestamptz not null default now()
);

alter table public.db_connections enable row level security;

-- Owner-only read.
create policy "Users can read own connection"
  on public.db_connections for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Owner-only insert. WITH CHECK guards against forging user_id.
create policy "Users can insert own connection"
  on public.db_connections for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Owner-only update.
create policy "Users can update own connection"
  on public.db_connections for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Owner-only delete.
create policy "Users can delete own connection"
  on public.db_connections for delete
  to authenticated
  using ((select auth.uid()) = user_id);
