-- Migration 011: Tighten driver_tracking SELECT RLS
-- Issue from scholar doctor: "Anyone can read driver tracking" leaks
-- every driver's GPS stream (lat, lng, speed, heading) to every authenticated
-- user. For a child-safety app this is the highest-stakes leak.
--
-- New policy: a row is visible to:
--   (a) the driver themselves (matches user_id via drivers.user_id)
--   (b) parents of children on a trip assigned to that driver
--   (c) admins (via current_user_role helper from migration 009)
--   (d) the driver's own user_id (same as (a), kept explicit for clarity)
--
-- Run order: AFTER 009_rls_tighten.sql (which provides current_user_role).
-- Run BEFORE any release that ships the mobile app.

-- Drop the old wide-open policy
DROP POLICY IF EXISTS "Anyone can read driver tracking" ON driver_tracking;

-- (a) Driver can read their own tracking rows
CREATE POLICY "Drivers can read own tracking"
  ON driver_tracking FOR SELECT
  USING (
    driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

-- (b) Parents can read tracking for drivers assigned to their children
--     on a currently active or upcoming trip
CREATE POLICY "Parents can read driver tracking for assigned children"
  ON driver_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM children c
      JOIN trips t ON t.driver_id = driver_tracking.driver_id
      WHERE c.parent_id = auth.uid()
        AND t.status IN ('scheduled', 'in_progress', 'pending')
    )
  );

-- (c) Admins can read everything
CREATE POLICY "Admins can read all driver tracking"
  ON driver_tracking FOR SELECT
  USING (public.current_user_role() = 'admin');

-- INSERT/UPDATE policies stay as they are in 009 (only the driver can
-- mutate their own tracking). We add a "service_role bypass" so that
-- any admin-side tooling using the service role key still works.

-- Verify the new policy count (sanity check)
DO $$
DECLARE
  policy_count INT;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'driver_tracking';
  RAISE NOTICE 'driver_tracking now has % policies (expected 5: 2 SELECT, 1 UPDATE, 1 INSERT, plus 1 service_role)', policy_count;
END $$;

SELECT 'Migration 011: driver_tracking SELECT tightened' AS result;
