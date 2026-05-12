-- =============================================================
-- Migration 011: Add crew_still_video column to events table
-- Represents a person who covers both still and video duties.
-- Safe to run multiple times (IF NOT EXISTS).
-- =============================================================

alter table public.events
  add column if not exists crew_still_video int not null default 0;
