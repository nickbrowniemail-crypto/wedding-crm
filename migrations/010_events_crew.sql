-- =============================================================
-- Migration 010: Add production crew columns to events table
-- Six nullable int columns, default 0 (absent = not assigned).
-- Safe to run multiple times (IF NOT EXISTS).
-- =============================================================

alter table public.events
  add column if not exists crew_still   int not null default 0,
  add column if not exists crew_video   int not null default 0,
  add column if not exists crew_candid  int not null default 0,
  add column if not exists crew_cine    int not null default 0,
  add column if not exists crew_drone   int not null default 0,
  add column if not exists crew_standee int not null default 0;
