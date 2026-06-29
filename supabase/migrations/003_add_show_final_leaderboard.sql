-- ============================================================
-- Add show_final_leaderboard column to sessions table
-- Run this in the Supabase SQL Editor
-- ============================================================

ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS show_final_leaderboard boolean DEFAULT true;
