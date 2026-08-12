-- Migration 013: leads table PII cleanup
-- Issue from scholar doctor: 010_leads_table.sql stored raw ip and
-- user_agent of every website visitor. POPIA (South Africa) requires
-- purpose limitation and retention limits.
--
-- Plan:
--   1. Hash existing IP values (one-way, can't reverse).
--   2. Drop the user_agent column entirely.
--   3. Add a 90-day retention TTL via a scheduled Edge Function
--      (see supabase/functions/cleanup-leads/index.ts).
--   4. For new leads: Edge Function hashes IP at insert time and never
--      stores user_agent. Update submit-lead accordingly.

-- 1. Add ip_hash column, populate it from existing ip, then drop ip
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ip_hash TEXT;
UPDATE leads
SET ip_hash = encode(digest(COALESCE(ip, '') || 'malumescholartrack-salt-rotate-me', 'sha256'), 'hex')
WHERE ip_hash IS NULL AND ip IS NOT NULL;
ALTER TABLE leads DROP COLUMN IF EXISTS ip;

-- 2. Drop user_agent
ALTER TABLE leads DROP COLUMN IF EXISTS user_agent;

-- 3. Add created_at index for the cleanup job (already exists from 010,
--    but make it explicit and add a TTL-friendly comment).
-- Already created in 010:
--   CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
-- The cleanup job will run: DELETE FROM leads WHERE created_at < now() - interval '90 days';

-- 4. Update the RLS note: leads remain service-role-only. The cleanup
--    job uses the service role key from a scheduled Edge Function.

SELECT 'Migration 013: leads PII hashed and UA dropped' AS result;
