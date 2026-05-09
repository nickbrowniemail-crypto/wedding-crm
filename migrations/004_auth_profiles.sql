-- =============================================================
-- Migration 004: Auth Profiles
-- Creates a profiles table linked to Supabase auth.users,
-- with RLS policies and an auto-create trigger on signup.
-- =============================================================

-- 1. Profiles table
create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text        not null default 'staff',
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- 2. Enable Row Level Security
alter table public.profiles enable row level security;

-- 3. RLS: authenticated users can read their own profile
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- 4. RLS: authenticated users can update their own profile
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- 5. Function: auto-create profile row when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

-- 6. Trigger: fire after new user inserted into auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================================
-- OPTIONAL: Back-fill profiles for any existing auth users
-- Run this only once if you already have users in auth.users
-- =============================================================
-- insert into public.profiles (id, full_name)
-- select id, split_part(email, '@', 1)
-- from auth.users
-- on conflict (id) do nothing;
