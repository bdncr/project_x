-- Patch for an already-provisioned Project X database. 2026-08-28.
-- Paste this whole file into Supabase Dashboard > SQL Editor and run it once.
-- Everything here is idempotent; re-running supabase/schema.sql top to bottom applies
-- the same change and is equally safe.
--
-- Delivers a job offer to the creator it was sent to. Before this table the invite dialog
-- only created a listing on the jobs board, so the creator was never actually told.

create table if not exists public.job_offers (
  id uuid primary key default gen_random_uuid(),
  -- The listing the offer created, and the project that prompted it. Both are set null on
  -- delete rather than cascading: the offer is still a real message once its job closes.
  job_id uuid references public.job_posts(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  budget text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);

create index if not exists job_offers_recipient_idx on public.job_offers (recipient_id, created_at desc);

alter table public.job_offers enable row level security;

-- Private to the two parties, unlike every other table in this schema: an offer carries a
-- budget and a personal note, so there is no public select policy.
drop policy if exists "Offers are readable by both parties" on public.job_offers;
create policy "Offers are readable by both parties" on public.job_offers for select
using (auth.uid() = recipient_id or auth.uid() = sender_id);
drop policy if exists "Users send their own offers" on public.job_offers;
create policy "Users send their own offers" on public.job_offers for insert with check (auth.uid() = sender_id);
-- Update is only ever used to stamp read_at, so it is the recipient's alone.
drop policy if exists "Recipients mark offers read" on public.job_offers;
create policy "Recipients mark offers read" on public.job_offers for update
using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
drop policy if exists "Both parties delete offers" on public.job_offers;
create policy "Both parties delete offers" on public.job_offers for delete
using (auth.uid() = recipient_id or auth.uid() = sender_id);

-- Table privileges, which RLS sits on top of rather than replaces. No anon grant: an
-- offer is never public.
grant select, insert, update, delete on public.job_offers to authenticated;

-- PostgREST caches the schema; nudge it so the new table takes effect immediately.
notify pgrst, 'reload schema';
