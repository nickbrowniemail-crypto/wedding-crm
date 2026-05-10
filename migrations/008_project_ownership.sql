-- =============================================================
-- Migration 008: Project Ownership — PM & RM on clients
--
-- Adds project_manager_id and relationship_manager_id to the
-- clients table, both as nullable UUID foreign keys referencing
-- profiles.id. Existing rows remain null — no data is lost.
--
-- Also widens the profiles SELECT policy so all authenticated
-- team members can look up PM/RM names across client lists
-- (previously restricted to own-row or admin-only).
-- =============================================================

-- ── 1. Add nullable ownership columns to clients ──────────────
alter table public.clients
  add column if not exists project_manager_id      uuid
    references public.profiles(id) on delete set null,
  add column if not exists relationship_manager_id uuid
    references public.profiles(id) on delete set null;

-- ── 2. Indexes for filtering and join performance ─────────────
create index if not exists idx_clients_project_manager
  on public.clients(project_manager_id);

create index if not exists idx_clients_relationship_manager
  on public.clients(relationship_manager_id);

-- ── 3. Allow all authenticated users to view all profiles ─────
-- Required so PM/RM names are visible to every role, not just
-- admins. The update policy from migration 005 is left intact.
drop policy if exists "View profiles" on public.profiles;

create policy "View profiles"
  on public.profiles
  for select
  to authenticated
  using (true);
