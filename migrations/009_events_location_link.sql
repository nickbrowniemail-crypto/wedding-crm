-- =============================================================
-- Migration 009: Add location_link column to events table
-- Optional field for Google Maps / location URLs.
-- Safe to run multiple times (IF NOT EXISTS).
-- =============================================================

alter table public.events
  add column if not exists location_link text;
