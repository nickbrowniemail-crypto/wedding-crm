-- =============================================================
-- Migration 007: Add missing columns to deliverables table
-- The form sends status, priority, delivered_date, and notes.
-- These columns may not exist in the original schema.
-- All additions are safe (IF NOT EXISTS) and have sensible defaults.
-- =============================================================

alter table public.deliverables
  add column if not exists status         text    not null default 'pending',
  add column if not exists priority       text    not null default 'medium',
  add column if not exists delivered_date date,
  add column if not exists notes          text;
