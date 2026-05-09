-- =============================================================
-- Migration 006: Structured Assignee Fields
-- Adds assignee_id (TEXT) and assignee_type ('team'|'vendor')
-- to tasks and deliverables. The existing assigned_to TEXT column
-- is kept for backward compat and used as the display-name cache.
-- New assignments write all three; old records keep assigned_to
-- and get NULL for the two new fields (graceful fallback).
-- =============================================================

-- ── tasks ──────────────────────────────────────────────────────
alter table public.tasks
  add column if not exists assignee_id   text,
  add column if not exists assignee_type text;

-- ── deliverables ───────────────────────────────────────────────
-- assigned_to may not exist yet on deliverables (older schema)
alter table public.deliverables
  add column if not exists assigned_to   text,
  add column if not exists assignee_id   text,
  add column if not exists assignee_type text;
