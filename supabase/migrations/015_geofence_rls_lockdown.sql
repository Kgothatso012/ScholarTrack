-- ============================================================================
-- Migration 015: geofence RLS lockdown + child-centric alert support
-- ----------------------------------------------------------------------------
-- Follow-up to the a437f9a anon-key incident. Migration 014 (f6cbeb1) omitted
-- `geofences` and `geofence_alerts` from its FORCE-RLS table set and never
-- dropped their `USING (true)` SELECT policies (003:145,148), so the shipped
-- anon key could still read home/school coordinates (geofences) and
-- child_id + location (geofence_alerts) — a live repeat of the breach.
--
-- Separately, migration 003 only granted geofence_alerts SELECT + UPDATE
-- (no INSERT policy), and the table was built vehicle/driver-centric
-- (geofence_id NOT NULL, alert_type IN entry/exit/speed/deviation) while the
-- child-safety feature records child_id + trip_id events ('pickup'/'dropoff').
-- Every geofence insert was therefore RLS-denied AND column/constraint-denied,
-- so the app's core promise (arrival notifications) failed on every event.
--
-- This migration:
--   1. Extends geofence_alerts to support child-centric alerts (additive only).
--   2. FORCE-enables RLS on both tables (closing the anon read path).
--   3. Replaces the blanket-open SELECT policies with ownership/driver/admin
--      scoped policies.
--   4. Adds the INSERT policy the driver app needs to record geofence events.
--
-- It does NOT touch the service_role (BYPASSRLS), so edge functions keep working.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend geofence_alerts for child-centric safety alerts.
--    003 made geofence_id NOT NULL and constrained alert_type to
--    entry/exit/speed/deviation; the child-safety feature inserts child_id +
--    trip_id with alert_type 'pickup'/'dropoff'. Make both work additively.
-- ---------------------------------------------------------------------------
ALTER TABLE geofence_alerts
  ALTER COLUMN geofence_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Relax alert_type to include the child-safety event types (keep the originals).
ALTER TABLE geofence_alerts DROP CONSTRAINT IF EXISTS geofence_alerts_alert_type_check;
ALTER TABLE geofence_alerts
  ADD CONSTRAINT geofence_alerts_alert_type_check
  CHECK (alert_type IN ('entry','exit','speed','deviation','pickup','dropoff','pickup_arrived','dropoff_arrived'));

-- Index the new lookups (parents/driver join on these).
CREATE INDEX IF NOT EXISTS idx_geofence_alerts_child ON geofence_alerts(child_id) WHERE child_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_geofence_alerts_trip ON geofence_alerts(trip_id) WHERE trip_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. FORCE Row Level Security on both tables (014's FORCE list omitted them).
-- ---------------------------------------------------------------------------
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences FORCE ROW LEVEL SECURITY;
ALTER TABLE geofence_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_alerts FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. geofences SELECT — drop the blanket-open policy; scope to parents (via
--    their children's trips), drivers (active trips), and admins.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read geofences" ON geofences;
DROP POLICY IF EXISTS "Admins can manage geofences" ON geofences;

CREATE POLICY "Parents can read geofences for their children"
  ON geofences FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM children c
      JOIN trips t ON t.child_id = c.id
      WHERE c.parent_id = auth.uid()
        AND t.status IN ('scheduled','in_progress','pending')
    )
  );

CREATE POLICY "Drivers can read geofences for active trips"
  ON geofences FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM drivers d
      JOIN trips t ON t.driver_id = d.id
      WHERE d.user_id = auth.uid()
        AND t.status IN ('scheduled','in_progress','pending')
    )
  );

CREATE POLICY "Admins can read all geofences"
  ON geofences FOR SELECT USING (public.current_user_role() = 'admin');

CREATE POLICY "Admins can manage geofences"
  ON geofences FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 4. geofence_alerts SELECT — drop blanket-open; scope to parents (their
--    children's alerts), drivers (their trips' alerts), admins.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read geofence alerts" ON geofence_alerts;
DROP POLICY IF EXISTS "Admins can resolve alerts" ON geofence_alerts;

CREATE POLICY "Parents can read alerts for their children"
  ON geofence_alerts FOR SELECT USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

CREATE POLICY "Drivers can read alerts for their trips"
  ON geofence_alerts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trips t
      JOIN drivers d ON d.id = t.driver_id
      WHERE d.user_id = auth.uid()
        AND (t.id = geofence_alerts.trip_id OR t.driver_id = geofence_alerts.driver_id)
    )
  );

CREATE POLICY "Admins can read all geofence alerts"
  ON geofence_alerts FOR SELECT USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 5. INSERT — a driver may record a geofence event for one of their active
--    trips. Scoped via trip_id so the client-side triggerGeofenceAlert call
--    (which passes child_id + trip_id) is authorized for the authenticated
--    driver on an active trip.
-- ---------------------------------------------------------------------------
CREATE POLICY "Drivers can insert geofence alerts"
  ON geofence_alerts FOR INSERT WITH CHECK (
    trip_id IN (
      SELECT t.id FROM trips t
      JOIN drivers d ON d.id = t.driver_id
      WHERE d.user_id = auth.uid()
        AND t.status IN ('scheduled','in_progress','pending')
    )
  );

-- ---------------------------------------------------------------------------
-- 6. UPDATE — admins resolve alerts (re-assert, scoped).
-- ---------------------------------------------------------------------------
CREATE POLICY "Admins can resolve alerts"
  ON geofence_alerts FOR UPDATE
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- 7. Verification — no blanket-open policies survive on either table.
-- ---------------------------------------------------------------------------
DO $$
DECLARE c INT;
BEGIN
  SELECT COUNT(*) INTO c FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('geofences','geofence_alerts')
    AND (qual = 'true' OR qual = '(true)');
  IF c > 0 THEN
    RAISE EXCEPTION 'SECURITY: % geofence policies still have USING (true) — anon read path must be closed', c;
  END IF;
  RAISE NOTICE 'Migration 015: geofence RLS locked down — anon can no longer read child locations.';
END $$;

SELECT 'Migration 015: geofence RLS lockdown + child-centric alert support applied' AS result;
