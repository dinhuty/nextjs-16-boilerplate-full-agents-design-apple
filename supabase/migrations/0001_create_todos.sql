-- 0001_create_todos.sql
-- Creates the `todos` table used by the home page (app/page.tsx).
-- Each row belongs to one auth user. RLS limits read / write to the owner.

create table if not exists public.todos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists todos_user_id_idx on public.todos(user_id);

alter table public.todos enable row level security;

-- Owner-only read.
create policy "Users can read own todos"
  on public.todos for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Owner-only insert. WITH CHECK guards against forging user_id.
create policy "Users can insert own todos"
  on public.todos for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Owner-only update. Both USING and WITH CHECK to prevent reassigning user_id.
create policy "Users can update own todos"
  on public.todos for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Owner-only delete.
create policy "Users can delete own todos"
  on public.todos for delete
  to authenticated
  using ((select auth.uid()) = user_id);
