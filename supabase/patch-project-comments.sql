-- Patch for an already-provisioned Project X database. 2026-08-28.
-- Paste this whole file into Supabase Dashboard > SQL Editor and run it once.
-- Everything here is idempotent; re-running supabase/schema.sql top to bottom applies
-- the same change and is equally safe.
--
-- Adds the comment thread under a case study. Before this table the project page kept
-- comments in React state only, so they vanished on reload and nobody else ever saw them.

create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index if not exists project_comments_project_idx on public.project_comments (project_id, created_at desc);

alter table public.project_comments enable row level security;

-- Table privileges, which RLS sits on top of rather than replaces: without these both API
-- roles get "permission denied for table project_comments" before any policy is consulted.
grant select on public.project_comments to anon;
grant select, insert, update, delete on public.project_comments to authenticated;

drop policy if exists "Comments are readable" on public.project_comments;
create policy "Comments are readable" on public.project_comments for select using (true);
drop policy if exists "Users write their comments" on public.project_comments;
create policy "Users write their comments" on public.project_comments for insert with check (auth.uid() = author_id);
drop policy if exists "Users update their comments" on public.project_comments;
create policy "Users update their comments" on public.project_comments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
-- Deleting is open to the comment's author and to the project's owner, so a creator can
-- moderate their own case study without an admin role.
drop policy if exists "Authors and project owners delete comments" on public.project_comments;
create policy "Authors and project owners delete comments" on public.project_comments for delete using (
  auth.uid() = author_id
  or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid())
);

-- PostgREST caches the schema; nudge it so the new grants take effect immediately.
notify pgrst, 'reload schema';
