-- 0002_create_sql_snippets.sql
-- Shared master-data table for the DB tool's SQL snippets.
-- Every authenticated user can read, create, edit, and delete any snippet.
-- The body holds SQL with ${param} placeholders; params are extracted in the UI.

create table if not exists public.sql_snippets (
  id          uuid primary key default gen_random_uuid(),
  tab         text not null,
  title       text not null,
  body        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  updated_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tab, title)
);

create index if not exists sql_snippets_tab_idx on public.sql_snippets(tab);

alter table public.sql_snippets enable row level security;

-- Master data: any authenticated user may read every snippet.
create policy "Authenticated can read snippets"
  on public.sql_snippets for select
  to authenticated
  using (true);

-- Any authenticated user may create snippets.
create policy "Authenticated can insert snippets"
  on public.sql_snippets for insert
  to authenticated
  with check (true);

-- Any authenticated user may edit any snippet (shared master data).
create policy "Authenticated can update snippets"
  on public.sql_snippets for update
  to authenticated
  using (true)
  with check (true);

-- Any authenticated user may delete any snippet (shared master data).
create policy "Authenticated can delete snippets"
  on public.sql_snippets for delete
  to authenticated
  using (true);
