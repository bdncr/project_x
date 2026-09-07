-- Patch for an already-provisioned Project X database. 2026-08-28.
-- Paste this whole file into Supabase Dashboard > SQL Editor and run it once.
-- Everything here is idempotent; re-running supabase/schema.sql top to bottom applies
-- the same change and is equally safe.
--
-- Completes the job-offer feature: the creator can now answer an offer instead of only
-- reading it, and the employer can see what came of the ones they sent.
--
-- Requires supabase/patch-job-offers.sql to have been run first.

alter table public.job_offers add column if not exists status text not null default 'pending'
  check (status in ('pending', 'accepted', 'declined'));
alter table public.job_offers add column if not exists reply text not null default '';
alter table public.job_offers add column if not exists responded_at timestamptz;

-- The employer's outbox reads by sender; the inbox index already covers the recipient.
create index if not exists job_offers_sender_idx on public.job_offers (sender_id, created_at desc);

-- The recipient's update policy already covered stamping read_at; answering writes to the
-- same row, so it needs no new policy — only a clearer name for what it now allows.
drop policy if exists "Recipients mark offers read" on public.job_offers;
drop policy if exists "Recipients read and answer offers" on public.job_offers;
create policy "Recipients read and answer offers" on public.job_offers for update
using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);

-- PostgREST caches the schema; nudge it so the new columns take effect immediately.
notify pgrst, 'reload schema';
