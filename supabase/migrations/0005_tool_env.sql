-- 0005_tool_env.sql
-- Replace the structured db_connections table with a generic per-(user, tool)
-- env store. Each tool (dbtool is just one of many) keeps its config as a plain
-- text blob in .env / GitLab-CI style; the tool's frontend parses it into
-- key=value pairs. RLS limits read / write to the owner.

drop table if exists public.db_connections;

create table if not exists public.tool_env (
  user_id     uuid not null references auth.users(id) on delete cascade,
  tool_key    text not null,
  content     text not null default '',
  updated_at  timestamptz not null default now(),
  primary key (user_id, tool_key)
);

alter table public.tool_env enable row level security;

-- Owner-only read.
create policy "Users can read own tool env"
  on public.tool_env for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Owner-only insert.
create policy "Users can insert own tool env"
  on public.tool_env for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Owner-only update.
create policy "Users can update own tool env"
  on public.tool_env for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Owner-only delete.
create policy "Users can delete own tool env"
  on public.tool_env for delete
  to authenticated
  using ((select auth.uid()) = user_id);
