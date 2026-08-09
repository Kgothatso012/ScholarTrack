-- =============================================================================
-- Schedule cleanup-retention as a Supabase pg_cron job.
-- =============================================================================
-- Run this in the Supabase Dashboard SQL editor (https://supabase.com/dashboard
-- /project/zjcribmwgavpzycgpwva/sql/new) AFTER supabase functions deploy
-- cleanup-retention succeeds.
--
-- Frequency: daily at 02:00 SAST (00:00 UTC). The function is idempotent and
-- bounded (max 20 passes × 5000 rows per call), so daily is safe. Hourly is
-- wasteful; weekly is too slow for the 90-day tracking retention to hold.
--
-- Cron expression: '0 0 * * *' (UTC).
-- =============================================================================

-- 1. Enable pg_cron and pg_net (only required if not already on the project).
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Schedule the daily invocation. The job invokes the function via its
--    HTTP webhook URL — the project URL is in the function's "Invoke URL"
--    field in the dashboard; copy it and replace <FUNCTION_URL> below.
--
--    Example function URL shape:
--    https://zjcribmwgavpzycgpwva.supabase.co/functions/v1/cleanup-retention
SELECT cron.schedule(
  'cleanup-retention-daily',
  '0 0 * * *',                                     -- every day at 00:00 UTC
  $$
  SELECT net.http_post(
    url    := 'https://zjcribmwgavpzycgpwva.supabase.co/functions/v1/cleanup-retention',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body   := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 3. Verify the job is registered.
SELECT jobname, schedule, active FROM cron.job WHERE jobname = 'cleanup-retention-daily';

-- =============================================================================
-- Rollback (if you need to remove the job later):
--   SELECT cron.unschedule('cleanup-retention-daily');
-- =============================================================================

-- =============================================================================
-- Alternative: invoke the function manually for an ad-hoc sweep.
-- (no auth header needed; service-role key is in function secrets)
-- =============================================================================
-- SELECT net.http_post(
--   url := 'https://zjcribmwgavpzycgpwva.supabase.co/functions/v1/cleanup-retention',
--   headers := '{"Content-Type": "application/json"}'::jsonb,
--   body := '{}'::jsonb
-- );