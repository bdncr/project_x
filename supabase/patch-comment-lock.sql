-- Patch for an already-provisioned Project X database. 2026-08-28.
-- Paste this whole file into Supabase Dashboard > SQL Editor and run it once.
-- Everything here is idempotent; re-running supabase/schema.sql top to bottom applies
-- the same change and is equally safe.
--
-- Makes the project's comments_disabled flag actually binding. Until now it only hid the
-- composer in the UI, so anything talking to PostgREST directly could still write a comment
-- to a project whose author had switched comments off.
--
-- Requires supabase/patch-project-comments.sql to have been run first.

drop policy if exists "Users write their comments" on public.project_comments;
create policy "Users write their comments" on public.project_comments for insert with check (
  auth.uid() = author_id
  and exists (
    select 1 from public.projects p
    where p.id = project_id
      and not p.comments_disabled
      -- A comment belongs on work that is actually visible; a draft or private project has
      -- no audience to comment on, and its owner does not need to comment on themselves.
      and p.is_published
  )
);

-- PostgREST caches policies; nudge it so the rule takes effect immediately.
notify pgrst, 'reload schema';
