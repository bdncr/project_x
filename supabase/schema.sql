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

create index if not exists projects_feed_idx on public.projects (is_published, published_at desc);
create index if not exists projects_owner_idx on public.projects (owner_id, updated_at desc);
create index if not exists project_likes_project_idx on public.project_likes (project_id);
create index if not exists project_saves_user_idx on public.project_saves (user_id);

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
