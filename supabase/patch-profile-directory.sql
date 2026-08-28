-- Patch for an already-provisioned Project X database. 2026-08-24.
-- Paste this whole file into Supabase Dashboard > SQL Editor and run it once.
-- Everything here is idempotent; re-running supabase/schema.sql top to bottom
-- applies the same two changes and is equally safe.
--
-- 1. profile_directory becomes security_invoker, clearing the advisor's
--    "Security Definer View" finding, and gains a thumbnails column.
-- 2. The 20 seed projects get attached to their seed profiles — they were
--    inserted before those profiles existed and were left with owner_id null.

-- Aggregated stats for the People page: appreciations/views summed across a creator's
-- published projects, plus their follower count, without every page recomputing joins.
-- security_invoker = on runs the view as the querying role instead of the view owner, so
-- the base tables' RLS still applies. Postgres defaults views to security_invoker = off,
-- which Supabase's advisor reports as the "Security Definer View" issue — every base table
-- below already has a public select policy, so this changes nothing for anon/authenticated.
-- Dropped and recreated rather than CREATE OR REPLACE'd: replace can only append columns
-- at the end of the list, so it fails with Postgres error 42P16 the moment a column is
-- inserted, reordered or renamed. Nothing depends on this view and the grant below is
-- reissued straight after, so the drop is free and the column list stays free to change.
drop view if exists public.profile_directory;
create view public.profile_directory
with (security_invoker = on) as
select
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.headline,
  p.location,
  p.employment_tags,
  p.is_pro,
  coalesce(proj.project_count, 0) as project_count,
  coalesce(proj.project_views, 0) as project_views,
  coalesce(proj.appreciations, 0) as appreciations,
  coalesce(follows.followers, 0) as followers,
  p.cover_url,
  coalesce(thumbs.covers, '{}'::text[]) as thumbnails
from public.profiles p
left join (
  select
    pr.owner_id,
    count(distinct pr.id) as project_count,
    sum(pr.view_count) as project_views,
    count(pl.*) as appreciations
  from public.projects pr
  left join public.project_likes pl on pl.project_id = pr.id
  where pr.is_published
  group by pr.owner_id
) proj on proj.owner_id = p.id
left join (
  select followee_id, count(*) as followers
  from public.profile_follows
  group by followee_id
) follows on follows.followee_id = p.id
left join (
  -- Up to four covers from the creator's newest published work, for the 4-up thumbnail
  -- strip on the People page cards (see components/people/CreatorCard.tsx).
  select owner_id, array_agg(cover_url order by rn) as covers
  from (
    select
      pr.owner_id,
      pr.cover_url,
      row_number() over (
        partition by pr.owner_id
        order by pr.published_at desc nulls last, pr.created_at desc
      ) as rn
    from public.projects pr
    where pr.is_published and pr.owner_id is not null
  ) ranked
  where rn <= 4
  group by owner_id
) thumbs on thumbs.owner_id = p.id;

grant select on public.profile_directory to anon, authenticated;

-- The seed projects above are inserted before these seed profiles exist, so they land with
-- owner_id null and stay detached: profile_directory then reports project_count 0 with no
-- thumbnails, and /profile/[id] finds nothing for "where owner_id = ...". Attach them here,
-- once both sides exist, grouped by the discipline each seed creator's headline claims.
update public.projects as pr
set owner_id = seed_project_owners.owner_id
from (values
  ('seed-proj-01', 'a1b2c3d4-0000-4a11-8a11-000000000001'::uuid), -- Золжаргал Б. · Brand Designer
  ('seed-proj-02', 'a1b2c3d4-0000-4a11-8a11-000000000001'::uuid),
  ('seed-proj-03', 'a1b2c3d4-0000-4a11-8a11-000000000007'::uuid), -- Төмөрбаатар Х. · Graphic Designer
  ('seed-proj-04', 'a1b2c3d4-0000-4a11-8a11-000000000007'::uuid),
  ('seed-proj-05', 'a1b2c3d4-0000-4a11-8a11-000000000008'::uuid), -- Уранцэцэг Н. · Editorial Designer
  ('seed-proj-06', 'a1b2c3d4-0000-4a11-8a11-000000000007'::uuid),
  ('seed-proj-07', 'a1b2c3d4-0000-4a11-8a11-000000000003'::uuid), -- Сарангэрэл Д. · Photographer
  ('seed-proj-08', 'a1b2c3d4-0000-4a11-8a11-000000000003'::uuid),
  ('seed-proj-09', 'a1b2c3d4-0000-4a11-8a11-000000000003'::uuid),
  ('seed-proj-10', 'a1b2c3d4-0000-4a11-8a11-000000000004'::uuid), -- Ганбаатар Э. · Illustrator
  ('seed-proj-11', 'a1b2c3d4-0000-4a11-8a11-000000000010'::uuid), -- Мөнхцэцэг Л. · Character Illustrator
  ('seed-proj-12', 'a1b2c3d4-0000-4a11-8a11-000000000004'::uuid),
  ('seed-proj-13', 'a1b2c3d4-0000-4a11-8a11-000000000009'::uuid), -- Эрдэнэбаяр С. · Product Designer
  ('seed-proj-14', 'a1b2c3d4-0000-4a11-8a11-000000000002'::uuid), -- Отгонбаяр Т. · UX/UI Designer
  ('seed-proj-15', 'a1b2c3d4-0000-4a11-8a11-000000000002'::uuid),
  ('seed-proj-16', 'a1b2c3d4-0000-4a11-8a11-000000000006'::uuid), -- Батчимэг Ж. · 3D Artist
  ('seed-proj-17', 'a1b2c3d4-0000-4a11-8a11-000000000006'::uuid),
  ('seed-proj-18', 'a1b2c3d4-0000-4a11-8a11-000000000006'::uuid),
  ('seed-proj-19', 'a1b2c3d4-0000-4a11-8a11-000000000005'::uuid), -- Номин-Эрдэнэ Ц. · Motion Designer
  ('seed-proj-20', 'a1b2c3d4-0000-4a11-8a11-000000000005'::uuid)
) as seed_project_owners(external_key, owner_id)
where pr.external_key = seed_project_owners.external_key
  and pr.owner_id is distinct from seed_project_owners.owner_id;

-- profile_directory changed shape, so PostgREST has to re-read the schema cache.
notify pgrst, 'reload schema';
