-- Project X database schema
-- Run this whole file once in Supabase Dashboard > SQL Editor.
-- It creates the Behance-style core: accounts, profiles, projects, likes and saves.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  headline text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- People directory: location/tags/pro status shown on the "Хүмүүс" search page.
alter table public.profiles add column if not exists location text not null default 'Улаанбаатар';
alter table public.profiles add column if not exists employment_tags text[] not null default '{}';
alter table public.profiles add column if not exists is_pro boolean not null default false;
-- Profile page banner, separate from any project cover (matches Behance's own
-- "Add a Banner Image" profile field). Nullable — the profile page falls back to
-- the creator's top project cover when unset.
alter table public.profiles add column if not exists cover_url text;

-- Seed people (below) aren't real logins, the same way seed projects/jobs have no
-- real owner — so profiles.id can't stay FK'd to auth.users for every row.
alter table public.profiles drop constraint if exists profiles_id_fkey;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  role text not null default 'Бүтээлч ажил',
  description text not null default '',
  category text not null,
  cover_url text not null,
  view_count integer not null default 0,
  published_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects add column if not exists role text not null default 'Бүтээлч ажил';
alter table public.projects add column if not exists view_count integer not null default 0;
alter table public.projects add column if not exists external_key text unique;
-- Rich block content from the project editor (Image/Text/Photo Grid/Video/Embed/...).
-- Empty for the seed gallery, which instead gets a synthesized case-study body client-side.
alter table public.projects add column if not exists body_blocks jsonb not null default '[]'::jsonb;
-- Optional call-to-action button set from the editor's "Захиалгат товч" sidebar panel.
alter table public.projects add column if not exists custom_button_label text;
alter table public.projects add column if not exists custom_button_url text;
alter table public.projects alter column owner_id drop not null;

-- Fields owned by the create-project Settings modal (see components/project/editor/SettingsModal.tsx).
-- "private" visibility never actually publishes regardless of the Publish button, enforced
-- client-side in app/project/create/page.tsx — password/link-only stay editor-visible but
-- Pro-locked, same as Behance's own reference, so they need no column.
alter table public.projects add column if not exists tags text[] not null default '{}';
alter table public.projects add column if not exists visibility text not null default 'everyone' check (visibility in ('everyone', 'private'));
alter table public.projects add column if not exists is_mature boolean not null default false;
alter table public.projects add column if not exists comments_disabled boolean not null default false;
alter table public.projects add column if not exists license text not null default 'all_rights_reserved';

create table if not exists public.project_likes (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.project_saves (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

-- Comment thread under a case study (components/project/CommentsSection.tsx). The project's
-- comments_disabled flag hides the composer in the UI; the insert policy below still allows a
-- comment on a project whose author later re-enables them, which is the intended behaviour.
create table if not exists public.project_comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

-- A job offer sent straight to a creator from a project page: the invite dialog creates the
-- listing above and this row is how the creator is actually told about it.
create table if not exists public.job_offers (
  job_id uuid references public.job_posts(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  budget text not null default '',
  note text not null default '',
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (sender_id <> recipient_id)
);

-- Following a creator on the People page.
create table if not exists public.profile_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index if not exists projects_feed_idx on public.projects (is_published, published_at desc);
create index if not exists projects_owner_idx on public.projects (owner_id, updated_at desc);
create index if not exists project_likes_project_idx on public.project_likes (project_id);
create index if not exists project_saves_user_idx on public.project_saves (user_id);
create index if not exists project_comments_project_idx on public.project_comments (project_id, created_at desc);
create index if not exists job_offers_recipient_idx on public.job_offers (recipient_id, created_at desc);
create index if not exists profile_follows_follower_idx on public.profile_follows (follower_id);
create index if not exists profile_follows_followee_idx on public.profile_follows (followee_id);

create or replace function public.increment_project_views(project_uuid uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if exists (
    select 1 from public.projects
    where id = project_uuid and (is_published or owner_id = auth.uid())
  ) then
    update public.projects set view_count = view_count + 1 where id = project_uuid;
  end if;
end;
$$;

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

-- Every signed-up user automatically gets the profile required by project ownership.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), 'user_' || substr(new.id::text, 1, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'Project X хэрэглэгч'), '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at before update on public.projects
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_likes enable row level security;
alter table public.project_saves enable row level security;
alter table public.project_comments enable row level security;
alter table public.job_offers enable row level security;
alter table public.profile_follows enable row level security;

drop policy if exists "Public profiles are readable" on public.profiles;
create policy "Public profiles are readable" on public.profiles for select using (true);
drop policy if exists "Users update their profile" on public.profiles;
create policy "Users update their profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Published projects are readable" on public.projects;
create policy "Published projects are readable" on public.projects for select using (is_published or auth.uid() = owner_id);
drop policy if exists "Users create their projects" on public.projects;
create policy "Users create their projects" on public.projects for insert with check (auth.uid() = owner_id);
drop policy if exists "Users update their projects" on public.projects;
create policy "Users update their projects" on public.projects for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "Users delete their projects" on public.projects;
create policy "Users delete their projects" on public.projects for delete using (auth.uid() = owner_id);

drop policy if exists "Likes are readable" on public.project_likes;
create policy "Likes are readable" on public.project_likes for select using (true);
drop policy if exists "Users manage their likes" on public.project_likes;
create policy "Users manage their likes" on public.project_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Saves are readable to owner" on public.project_saves;
create policy "Saves are readable to owner" on public.project_saves for select using (auth.uid() = user_id);
drop policy if exists "Users manage their saves" on public.project_saves;
create policy "Users manage their saves" on public.project_saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

-- Private to the two parties, unlike every other table here: an offer carries a budget and a
-- personal note, so there is no public select policy and no anon grant.
drop policy if exists "Offers are readable by both parties" on public.job_offers;
create policy "Offers are readable by both parties" on public.job_offers for select
using (auth.uid() = recipient_id or auth.uid() = sender_id);
drop policy if exists "Users send their own offers" on public.job_offers;
create policy "Users send their own offers" on public.job_offers for insert with check (auth.uid() = sender_id);
drop policy if exists "Recipients mark offers read" on public.job_offers;
create policy "Recipients mark offers read" on public.job_offers for update
using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
drop policy if exists "Both parties delete offers" on public.job_offers;
create policy "Both parties delete offers" on public.job_offers for delete
using (auth.uid() = recipient_id or auth.uid() = sender_id);

drop policy if exists "Follows are readable" on public.profile_follows;
create policy "Follows are readable" on public.profile_follows for select using (true);
drop policy if exists "Users manage their follows" on public.profile_follows;
create policy "Users manage their follows" on public.profile_follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- Twenty starter portfolio projects (no real owner — idempotent, only insert once).
insert into public.projects (external_key, title, role, description, category, cover_url, view_count, is_published, published_at) values
  ('seed-proj-01', 'Nomad Coffee — брэндийн айдентик', 'Brand Designer', 'Улаанбаатарын шинэ кофе шопын лого, савлагаа, дэлгүүрийн бүрэн визуал системийг боловсрууллаа.', 'Брэнд', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&h=800&q=80', 2300, true, '2026-08-10T08:00:00Z'),
  ('seed-proj-02', 'Steppe Hotels лого шинэчлэл', 'Brand Strategist', 'Зочид буудлын сүлжээний брэнд стратеги, лого, өнгө, typography системийг дахин боловсрууллаа.', 'Брэнд', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&h=1000&q=80', 1600, true, '2026-08-08T08:00:00Z'),
  ('seed-proj-03', 'Хаан Атц — картын дизайн', 'Graphic Designer', 'Дижитал болон физик картны шинэ визуал хэв маягийг санал болголоо.', 'Брэнд', 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&h=600&q=80', 1100, true, '2026-08-05T08:00:00Z'),
  ('seed-proj-04', 'Naadam фестивалийн постер цуврал', 'Graphic Designer', 'Зуны Наадам баярт зориулсан 6 ширхэг постерын цуврал, гар зургийн хэв маягаар.', 'График', 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=800&h=1000&q=80', 4100, true, '2026-08-12T08:00:00Z'),
  ('seed-proj-05', 'UB Magazine — хуудасны дизайн', 'Editorial Designer', 'Сэтгүүлийн дугаар бүрийн layout, typography, зурагжуулалтын системийг хариуцсан.', 'График', 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=800&h=800&q=80', 1450, true, '2026-08-06T08:00:00Z'),
  ('seed-proj-06', 'Gobi Digital брошур', 'Graphic Designer', 'Технологийн компанийн үйлчилгээний танилцуулга материалын дизайн.', 'График', 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=800&h=600&q=80', 890, true, '2026-08-02T08:00:00Z'),
  ('seed-proj-07', 'Говийн нүүдэлчид', 'Photographer', 'Өмнөговь аймгийн нүүдэлчдийн өдөр тутмын амьдралыг харуулсан баримтат зургийн цуврал.', 'Гэрэл зураг', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&h=1000&q=80', 5200, true, '2026-08-14T08:00:00Z'),
  ('seed-proj-08', 'Хотын архитектур цуврал', 'Photographer', 'Улаанбаатар хотын орчин үеийн барилгуудыг дүрсэлсэн минимал хэв маягийн зургийн цуврал.', 'Гэрэл зураг', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&h=800&q=80', 2900, true, '2026-08-09T08:00:00Z'),
  ('seed-proj-09', 'Hunnu Coffee — бүтээгдэхүүний зураг', 'Product Photographer', 'Орон нутгийн кофе брэндийн бүтээгдэхүүний каталогт зориулсан студийн зураг авалт.', 'Гэрэл зураг', 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&h=600&q=80', 1050, true, '2026-08-01T08:00:00Z'),
  ('seed-proj-10', 'Монгол домгийн дүрүүд', 'Illustrator', 'Монгол ардын үлгэрийн дүрүүдийг орчин үеийн хэв маягаар дахин дүрсэлсэн цуврал.', 'Зураглал', 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=800&h=1000&q=80', 3800, true, '2026-08-13T08:00:00Z'),
  ('seed-proj-11', '''Алтан гадас'' хүүхдийн ном', 'Character Illustrator', 'Хүүхдийн номын дүрс, хуудас бүрийн зохион байгуулалтыг бүрэн хариуцсан.', 'Зураглал', 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=800&h=800&q=80', 2200, true, '2026-08-07T08:00:00Z'),
  ('seed-proj-12', 'Character Pack — Adventure', 'Game Illustrator', 'Мобайл тоглоомд зориулсан дүрийн загварчлал, өнгөний хувилбарууд.', 'Зураглал', 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=800&h=600&q=80', 1600, true, '2026-08-03T08:00:00Z'),
  ('seed-proj-13', 'Fintech апп дахин загварчлал', 'Product Designer', 'Санхүүгийн аппын хэрэглэгчийн туршлага, интерфэйсийг судалгаанд үндэслэн бүрэн шинэчиллээ.', 'UX/UI', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=800&h=1000&q=80', 4400, true, '2026-08-15T08:00:00Z'),
  ('seed-proj-14', 'Landio — AI компанийн лэндинг', 'UX/UI Designer', 'AI SaaS компанийн хөрвөлтийг нэмэгдүүлэхэд чиглэсэн лэндинг хуудасны дизайн.', 'UX/UI', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=800&h=800&q=80', 3300, true, '2026-08-11T08:00:00Z'),
  ('seed-proj-15', 'Delivery апп UX судалгаа', 'UX Researcher', 'Хүнс хүргэлтийн аппын захиалгын урсгалыг хэрэглэгчийн судалгаагаар хялбаршууллаа.', 'UX/UI', 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=800&h=600&q=80', 1900, true, '2026-08-04T08:00:00Z'),
  ('seed-proj-16', 'Nomad House — 3D интерьер', '3D Artist', 'Орчин үеийн амины сууцны интерьерийн 3D визуалчлал, материалын судалгаа.', '3D', 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&h=1000&q=80', 2700, true, '2026-08-13T14:00:00Z'),
  ('seed-proj-17', 'Бүтээгдэхүүний 3D загвар', '3D Artist', 'Хэрэглээний барааны 3D загварчлал, продукт рендерийн цуврал.', '3D', 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&h=800&q=80', 1300, true, '2026-08-06T14:00:00Z'),
  ('seed-proj-18', 'Virtual Showroom', '3D Visualizer', 'Машины загварыг онлайнаар эргүүлж үзэх боломжтой интерактив 3D орчин.', '3D', 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&h=600&q=80', 2400, true, '2026-08-09T14:00:00Z'),
  ('seed-proj-19', 'Brand Motion Reel 2026', 'Motion Designer', 'Оны турш хийсэн шилдэг ажлуудыг нэгтгэсэн богино хэлбэрийн motion reel.', 'Motion', 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&h=1000&q=80', 3600, true, '2026-08-14T14:00:00Z'),
  ('seed-proj-20', 'App Onboarding анимаци', 'Motion Designer', 'Аппын эхлэлийн дэлгэцүүдэд зориулсан богино микро-анимацийн цуврал.', 'Motion', 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=800&h=800&q=80', 1550, true, '2026-08-05T14:00:00Z')
on conflict (external_key) do nothing;

-- Jobs: Behance-inspired creative job board with public listings, saves and applications.
create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  external_key text unique not null default ('job-' || replace(gen_random_uuid()::text, '-', '')),
  title text not null check (char_length(title) between 2 and 160),
  company text not null check (char_length(company) between 2 and 120),
  location text not null default 'Ulaanbaatar',
  work_mode text not null default 'hybrid' check (work_mode in ('remote', 'hybrid', 'on_site')),
  employment_type text not null default 'full_time' check (employment_type in ('freelance', 'full_time', 'contract')),
  salary_text text not null default 'Salary negotiable',
  description text not null default '',
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  skills text[] not null default '{}',
  company_color text not null default '#1769ff',
  hiring_contact text,
  contact_role text,
  applicants_count integer not null default 0 check (applicants_count >= 0),
  status text not null default 'active' check (status in ('draft', 'active', 'closed')),
  published_at timestamptz not null default now(),
  closing_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_saves (
  job_id uuid not null references public.job_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (job_id, user_id)
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_posts(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  cover_letter text not null default '',
  status text not null default 'submitted' check (status in ('submitted', 'reviewing', 'shortlisted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create index if not exists job_posts_feed_idx on public.job_posts (status, published_at desc);
create index if not exists job_posts_owner_idx on public.job_posts (owner_id, created_at desc);
create index if not exists job_posts_type_idx on public.job_posts (employment_type, work_mode, published_at desc);
create index if not exists job_saves_user_idx on public.job_saves (user_id, created_at desc);
create index if not exists job_applications_applicant_idx on public.job_applications (applicant_id, created_at desc);
create index if not exists job_applications_job_idx on public.job_applications (job_id, created_at desc);

drop trigger if exists set_job_posts_updated_at on public.job_posts;
create trigger set_job_posts_updated_at before update on public.job_posts
for each row execute procedure public.set_updated_at();

drop trigger if exists set_job_applications_updated_at on public.job_applications;
create trigger set_job_applications_updated_at before update on public.job_applications
for each row execute procedure public.set_updated_at();

create or replace function public.sync_job_applicant_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.job_posts set applicants_count = applicants_count + 1 where id = new.job_id;
    return new;
  end if;
  if tg_op = 'DELETE' then
    update public.job_posts set applicants_count = greatest(0, applicants_count - 1) where id = old.job_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists sync_job_applicant_count on public.job_applications;
create trigger sync_job_applicant_count
after insert or delete on public.job_applications
for each row execute procedure public.sync_job_applicant_count();

alter table public.job_posts enable row level security;
alter table public.job_saves enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists "Active jobs are readable" on public.job_posts;
create policy "Active jobs are readable" on public.job_posts for select
using (status = 'active' or auth.uid() = owner_id);
drop policy if exists "Users create their job posts" on public.job_posts;
create policy "Users create their job posts" on public.job_posts for insert
with check (auth.uid() = owner_id);
drop policy if exists "Owners update their job posts" on public.job_posts;
create policy "Owners update their job posts" on public.job_posts for update
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "Owners delete their job posts" on public.job_posts;
create policy "Owners delete their job posts" on public.job_posts for delete
using (auth.uid() = owner_id);

drop policy if exists "Users read their job saves" on public.job_saves;
create policy "Users read their job saves" on public.job_saves for select using (auth.uid() = user_id);
drop policy if exists "Users manage their job saves" on public.job_saves;
create policy "Users manage their job saves" on public.job_saves for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Applicants and job owners view applications" on public.job_applications;
create policy "Applicants and job owners view applications" on public.job_applications for select
using (auth.uid() = applicant_id or exists (select 1 from public.job_posts where job_posts.id = job_id and job_posts.owner_id = auth.uid()));
drop policy if exists "Users submit their applications" on public.job_applications;
create policy "Users submit their applications" on public.job_applications for insert
with check (auth.uid() = applicant_id);
drop policy if exists "Applicants withdraw their applications" on public.job_applications;
create policy "Applicants withdraw their applications" on public.job_applications for delete
using (auth.uid() = applicant_id);

-- The API roles need table privileges in addition to the row-level policies above.
grant usage on schema public to anon, authenticated;

grant select on public.profiles, public.projects, public.project_likes, public.project_comments, public.job_posts, public.profile_follows to anon;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects, public.project_likes, public.project_saves to authenticated;
grant select, insert, update, delete on public.job_posts, public.job_saves, public.job_applications to authenticated;
grant select, insert, delete on public.profile_follows to authenticated;
grant select, insert, update, delete on public.project_comments to authenticated;
grant select, insert, update, delete on public.job_offers to authenticated;

grant execute on function public.increment_project_views(uuid) to anon, authenticated;
notify pgrst, 'reload schema';

-- Ten starter creator profiles for the "Хүмүүс" page. Not real accounts (see the
-- dropped profiles_id_fkey above) — idempotent and safe to re-run, matched by id.
insert into public.profiles (id, username, display_name, headline, location, employment_tags, is_pro, cover_url) values
  ('a1b2c3d4-0000-4a11-8a11-000000000001', 'seed_zoljargal_b', 'Золжаргал Б.', 'Brand Designer', 'Улаанбаатар', array['Онцлох', 'Freelance'], true, 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=1600&h=400&q=80'),
  ('a1b2c3d4-0000-4a11-8a11-000000000002', 'seed_otgonbayar_t', 'Отгонбаяр Т.', 'UX/UI Designer', 'Улаанбаатар', array['Бүтэн цаг'], true, 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1600&h=400&q=80'),
  ('a1b2c3d4-0000-4a11-8a11-000000000003', 'seed_sarangerel_d', 'Сарангэрэл Д.', 'Photographer', 'Улаанбаатар', array['Үйлчилгээ'], false, 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&h=400&q=80'),
  ('a1b2c3d4-0000-4a11-8a11-000000000004', 'seed_ganbaatar_e', 'Ганбаатар Э.', 'Illustrator', 'Дархан-Уул', array['Freelance'], false, 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1600&h=400&q=80'),
  ('a1b2c3d4-0000-4a11-8a11-000000000005', 'seed_nominerdene_ts', 'Номин-Эрдэнэ Ц.', 'Motion Designer', 'Улаанбаатар', array['Бүтэн цаг'], true, 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1600&h=400&q=80'),
  ('a1b2c3d4-0000-4a11-8a11-000000000006', 'seed_batchimeg_j', 'Батчимэг Ж.', '3D Artist', 'Эрдэнэт', array['Freelance'], false, 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1600&h=400&q=80'),
  ('a1b2c3d4-0000-4a11-8a11-000000000007', 'seed_tumurbaatar_kh', 'Төмөрбаатар Х.', 'Graphic Designer', 'Улаанбаатар', array['Үйлчилгээ'], false, 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1600&h=400&q=80'),
  ('a1b2c3d4-0000-4a11-8a11-000000000008', 'seed_urantsetseg_n', 'Уранцэцэг Н.', 'Editorial Designer', 'Ховд', array[]::text[], false, 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=1600&h=400&q=80'),
  ('a1b2c3d4-0000-4a11-8a11-000000000009', 'seed_erdenebayar_s', 'Эрдэнэбаяр С.', 'Product Designer', 'Улаанбаатар', array['Бүтэн цаг'], true, 'https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=1600&h=400&q=80'),
  ('a1b2c3d4-0000-4a11-8a11-000000000010', 'seed_munkhtsetseg_l', 'Мөнхцэцэг Л.', 'Character Illustrator', 'Улаанбаатар', array['Freelance'], false, 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=1600&h=400&q=80')
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  headline = excluded.headline,
  location = excluded.location,
  employment_tags = excluded.employment_tags,
  is_pro = excluded.is_pro,
  cover_url = excluded.cover_url;

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

-- Twenty realistic starter listings. These are idempotent and only insert once.
insert into public.job_posts (external_key, title, company, location, work_mode, employment_type, salary_text, description, responsibilities, requirements, skills, company_color, hiring_contact, contact_role, applicants_count, published_at) values
  ('seed-graphic-social', 'Graphic Designer and Social Media Manager', 'Nomad House Studio', 'Ulaanbaatar', 'on_site', 'full_time', '₮3.0–4.5 million / month', 'Own the visual identity and social content for a growing creative studio.', array['Create social and campaign visual assets', 'Maintain consistent brand execution', 'Work with marketing on content calendars'], array['2+ years of relevant experience', 'Strong portfolio', 'Comfortable collaborating with a small team'], array['Adobe Photoshop', 'Illustrator', 'Social media', 'Branding'], '#171717', 'Naran T.', 'Hiring manager', 14, now() - interval '3 hours'),
  ('seed-ux-ui', 'UX/UI Designer', 'Tenger Tech', 'Ulaanbaatar · Hybrid', 'hybrid', 'full_time', '₮4.0–6.0 million / month', 'Design clear and useful B2B product experiences with a product-minded team.', array['Create user flows and wireframes', 'Extend the design system', 'Test prototypes with users'], array['3+ years of product design experience', 'Strong Figma portfolio', 'Research mindset'], array['Figma', 'UX Research', 'Design systems', 'Prototyping'], '#3157d6', 'Munkh-Orgil B.', 'Product lead', 22, now() - interval '7 hours'),
  ('seed-3d-motion', '3D Motion Artist', 'Altan Frame', 'Mongolia · Remote', 'remote', 'freelance', '₮2.5–5.0 million / project', 'Create high-impact 3D motion for a brand launch and social campaign.', array['Build 3D scenes and animation', 'Render and composite final visuals', 'Collaborate with the creative director'], array['Demonstrated 3D motion portfolio', 'Can manage delivery independently', 'Available this month'], array['Blender', 'Cinema 4D', 'After Effects', '3D Art'], '#773ce8', 'Saruul G.', 'Creative producer', 8, now() - interval '1 day'),
  ('seed-product-photographer', 'Product Photographer', 'Bayan Market', 'Ulaanbaatar', 'on_site', 'freelance', '₮1.8–3.2 million / project', 'Photograph food and lifestyle products for a catalogue and campaign.', array['Plan studio shoots', 'Set lighting and styling', 'Deliver retouched final images'], array['Relevant commercial work samples', 'Own or access professional camera equipment', 'Good product-lighting skills'], array['Photography', 'Lightroom', 'Retouching', 'Studio lighting'], '#d6603b', 'Temuulen D.', 'Marketing manager', 11, now() - interval '1 day 5 hours'),
  ('seed-video-editor', 'Video Editor', 'Khangai Media', 'Mongolia · Remote', 'remote', 'freelance', '₮2.0–3.5 million / month', 'Edit YouTube episodes and fast-paced short-form content for a regular production schedule.', array['Edit long-form video', 'Prepare Reels and Shorts cuts', 'Handle basic colour and sound finishing'], array['Video editing portfolio required', 'Fast and organised workflow', 'Mongolian and English captions are a plus'], array['Premiere Pro', 'After Effects', 'Storytelling', 'Sound design'], '#e23d7a', 'Enkhjin Ts.', 'Content producer', 17, now() - interval '2 days'),
  ('seed-brand-strategist', 'Brand Strategist', 'Ulaan Creative', 'Ulaanbaatar · Hybrid', 'hybrid', 'full_time', '₮4.5–6.5 million / month', 'Shape positioning, voice and campaign platforms for ambitious local brands.', array['Run market and audience research', 'Develop brand platforms', 'Lead client presentations'], array['Strategy or agency experience', 'Excellent written communication', 'Presentation confidence'], array['Brand Strategy', 'Research', 'Copywriting', 'Presentation'], '#007c70', 'Ariunbold E.', 'Strategy director', 6, now() - interval '2 days 6 hours'),
  ('seed-character-artist', 'Illustrator / Character Artist', 'Tsagaan Bichig', 'Mongolia · Remote', 'remote', 'freelance', '₮1.5–3.0 million / project', 'Create warm character and editorial illustration for a children’s digital product.', array['Develop character concepts', 'Prepare colour and style guides', 'Deliver final production assets'], array['Illustration portfolio required', 'Strong visual storytelling', 'Can work from a written brief'], array['Illustration', 'Character Design', 'Procreate', 'Photoshop'], '#e79d21', 'Undrakh O.', 'Project lead', 19, now() - interval '3 days'),
  ('seed-webflow', 'Webflow Developer', 'Gobi Digital', 'Mongolia · Remote', 'remote', 'full_time', '₮3.5–5.5 million / month', 'Turn Figma designs into polished, maintainable marketing websites.', array['Build responsive Webflow sites', 'Structure CMS collections', 'Improve SEO and performance'], array['Production Webflow examples', 'Strong HTML and CSS knowledge', 'Careful QA habits'], array['Webflow', 'HTML/CSS', 'SEO', 'Figma'], '#1969fb', 'Gantulga Kh.', 'Engineering lead', 12, now() - interval '3 days 5 hours'),
  ('seed-interior', 'Interior Visualizer', 'Orkhon Architects', 'Ulaanbaatar', 'on_site', 'full_time', '₮3.0–5.0 million / month', 'Create photorealistic visuals and material concepts for residential and hospitality projects.', array['Model and render interior scenes', 'Build material and furniture palettes', 'Apply feedback from the client team'], array['Architecture or interior portfolio', 'Photorealistic rendering experience', 'Detail-oriented approach'], array['3ds Max', 'V-Ray', 'Interior Design', 'AutoCAD'], '#665d55', 'Oyungerel N.', 'Design manager', 9, now() - interval '4 days'),
  ('seed-content-creator', 'Content Creator', 'Hunnu Coffee', 'Ulaanbaatar', 'on_site', 'full_time', '₮2.5–3.8 million / month', 'Tell stories about coffee culture and community through photo and short-form video.', array['Plan weekly content', 'Shoot Reels and photography', 'Cover community events'], array['Active social portfolio', 'Comfortable on location', 'Interest in food and coffee culture'], array['Content Creation', 'TikTok', 'Photography', 'Copywriting'], '#8c5037', 'Khulan J.', 'Brand manager', 27, now() - interval '4 days 7 hours'),
  ('seed-product-designer', 'Product Designer', 'Salkhi Finance', 'Ulaanbaatar · Hybrid', 'hybrid', 'full_time', '₮5.0–7.0 million / month', 'Lead UX and interface design for the next generation of a finance app.', array['Facilitate product discovery', 'Design end-to-end user journeys', 'Prepare developer handoff'], array['Fintech or mobile experience preferred', 'Solid research practice', 'Senior-level Figma skills'], array['Product Design', 'Figma', 'User Testing', 'Mobile UI'], '#126d9b', 'Battur D.', 'Head of product', 15, now() - interval '5 days'),
  ('seed-motion-designer', 'Motion Graphic Designer', 'Chinggis TV', 'Ulaanbaatar', 'on_site', 'full_time', '₮3.0–4.8 million / month', 'Make title packages, promo motion and broadcast visuals for digital programmes.', array['Create broadcast graphics', 'Animate promo content', 'Maintain a reliable render pipeline'], array['Motion portfolio required', 'Comfortable with fast deadlines', 'Broadcast experience is a plus'], array['After Effects', 'Cinema 4D', 'Broadcast', 'Animation'], '#b21e4b', 'Tuyaa E.', 'Production manager', 10, now() - interval '5 days 5 hours'),
  ('seed-type-designer', 'Mongolian Script Type Designer', 'Bichig Lab', 'Mongolia · Remote', 'remote', 'freelance', '₮3.0–6.0 million / project', 'Develop a contemporary Mongolian script display typeface with Latin companion characters.', array['Develop the glyph set', 'Tune spacing and kerning', 'Prepare usable font files'], array['Type design samples required', 'Knowledge of Mongolian script', 'Careful testing process'], array['Typography', 'Glyphs', 'FontLab', 'Mongolian Script'], '#23263d', 'Bilguun L.', 'Type director', 4, now() - interval '6 days'),
  ('seed-event-designer', 'Event Visual Designer', 'Naadam Collective', 'Ulaanbaatar', 'on_site', 'freelance', '₮2.0–4.0 million / project', 'Design the key visual, stage screens and social kit for a major summer event.', array['Create the event visual concept', 'Prepare large-format layouts', 'Coordinate closely with event production'], array['Event or campaign examples', 'Confident working at scale', 'Available for the event period'], array['Art Direction', 'Illustrator', 'Print Design', 'Branding'], '#ed542b', 'Maral A.', 'Event producer', 13, now() - interval '7 days'),
  ('seed-sound-designer', 'Sound Designer', 'Khuvsgul Games', 'Mongolia · Remote', 'remote', 'freelance', '₮2.5–4.5 million / project', 'Design environmental, UI and character sounds for an independent game.', array['Build an SFX library', 'Implement gameplay audio', 'Mix and master final assets'], array['Game-audio work samples', 'Comfortable with iteration', 'Own production setup'], array['Sound Design', 'FMOD', 'Reaper', 'Game Audio'], '#3e2d6d', 'Misheel R.', 'Game producer', 7, now() - interval '7 days 5 hours'),
  ('seed-copywriter', 'Creative Copywriter', 'Taliin Ads', 'Ulaanbaatar · Hybrid', 'hybrid', 'full_time', '₮3.0–4.5 million / month', 'Write campaign concepts, scripts, social copy and durable brand voice systems.', array['Develop campaign ideas', 'Write Mongolian and English copy', 'Support creative pitches'], array['Copywriting portfolio', 'Strong command of Mongolian', 'Agency experience preferred'], array['Copywriting', 'Campaigns', 'Storytelling', 'Brand Voice'], '#334859', 'Enkhmaa S.', 'Creative director', 16, now() - interval '8 days'),
  ('seed-fashion-stylist', 'Fashion Stylist', 'Khaan Atelier', 'Ulaanbaatar', 'on_site', 'freelance', '₮1.5–3.0 million / shoot', 'Develop seasonal styling for editorial and e-commerce shoots.', array['Create complete looks', 'Style talent on shoot days', 'Prepare moodboards and casting references'], array['Fashion styling portfolio', 'Strong sourcing network', 'Available for scheduled shoots'], array['Fashion', 'Styling', 'Editorial', 'Art Direction'], '#a87965', 'Nomin-Erdene G.', 'Studio manager', 5, now() - interval '8 days 5 hours'),
  ('seed-ar-filter', 'AR Filter Artist', 'Kite Experience', 'Mongolia · Remote', 'remote', 'freelance', '₮2.0–3.5 million / project', 'Build Instagram and TikTok AR filters for a brand activation.', array['Design AR-effect concepts', 'Build face-tracking effects', 'Prepare client demos and publishing assets'], array['AR work examples', 'Fast prototyping ability', 'Current platform knowledge'], array['Spark AR', 'Effect House', '3D', 'Interaction'], '#00a6a0', 'Erdenebat D.', 'Experience director', 11, now() - interval '9 days'),
  ('seed-junior-designer', 'Junior Graphic Designer', 'Ekhlel Agency', 'Ulaanbaatar', 'on_site', 'full_time', '₮1.8–2.8 million / month', 'Join an agency team and grow through social, banner and presentation design work.', array['Prepare social posts and banners', 'Support senior designers', 'Keep project assets organised'], array['Entry-level portfolio', 'Open to feedback', 'Reliable teamwork'], array['Photoshop', 'Illustrator', 'Layout', 'Teamwork'], '#427ec4', 'Uyanga P.', 'Design lead', 31, now() - interval '10 days'),
  ('seed-creative-director', 'Creative Director', 'Steppe Ventures', 'Ulaanbaatar · Hybrid', 'hybrid', 'full_time', '₮6.0–9.0 million / month', 'Lead brand, product and launch campaigns for an international portfolio of startups.', array['Set the creative vision', 'Lead a multidisciplinary team', 'Partner with founders and clients'], array['Senior creative leadership experience', 'Strong multidisciplinary portfolio', 'Clear strategic communication'], array['Creative Direction', 'Leadership', 'Brand Strategy', 'Product'], '#1d2630', 'Gerelmaa J.', 'Managing partner', 3, now() - interval '12 days')
on conflict (external_key) do nothing;

notify pgrst, 'reload schema';
