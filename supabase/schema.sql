-- Run in the Supabase SQL editor after creating a project.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null,
  display_name text not null,
  avatar_url text,
  headline text,
  created_at timestamptz default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null,
  cover_url text not null,
  published_at timestamptz default now(),
  is_published boolean default false
);

create table public.project_likes (
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

create table public.project_saves (
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_likes enable row level security;
alter table public.project_saves enable row level security;

create policy "Public profiles are readable" on public.profiles for select using (true);
create policy "Published projects are readable" on public.projects for select using (is_published = true);
create policy "Creators manage their projects" on public.projects for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users manage their saves" on public.project_saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage their likes" on public.project_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
