-- =============================================================
-- Migration 005: Team Management
-- Adds email column to profiles, updates RLS so admins can
-- manage all profiles, and adds an is_admin() helper to
-- avoid RLS recursion.
--
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================

-- 1. Add email column to profiles (for display without querying auth.users)
alter table public.profiles
  add column if not exists email text;

-- 2. Update the new-user trigger to also capture email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        email     = excluded.email;
  return new;
end;
$$;

-- 3. Back-fill email for any profiles created before this migration
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

-- 4. Security-definer helper: checks if the calling user is an admin.
--    Using security definer avoids RLS recursion when this function
--    is referenced inside a policy on the same table.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 5. Drop the old narrow policies from migration 004
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- 6. Recreate: users see their own row; admins see all rows
create policy "View profiles"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

-- 7. Recreate: users update their own row; admins update any row
create policy "Update profiles"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id or public.is_admin());

-- =============================================================
-- After running this migration:
--
-- 1. Promote the first user to admin:
--    update public.profiles
--    set role = 'admin'
--    where email = 'your@email.com';
--
-- 2. Set env vars in Vercel project:
--    SUPABASE_URL             = https://slhkiukjgednlmosbjpm.supabase.co
--    SUPABASE_SERVICE_ROLE_KEY = <from Supabase → Settings → API → service_role>
-- =============================================================
