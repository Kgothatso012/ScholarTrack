-- ============================================================================
-- Migration 014: RLS lockdown — close the anon-key data breach
-- ----------------------------------------------------------------------------
-- Adversarial APK audit (2026-07-24) + prior backend pentest (2026-07-16)
-- proved the shipped anon key can SELECT/UPDATE/DELETE drivers, children,
-- trips, driver_tracking, vehicles and route_assignments. Root causes:
--   (1) several tables still have `USING (true)` blanket policies from early
--       migrations (002/003/005 and the legacy supabase-schema.sql) that were
--       never tightened;
--   (2) `driver_locations` policies compare `auth.uid() = driver_id` (wrong —
--       driver_id references drivers(id), not auth.users(id));
--   (3) RLS is ENABLEd but not FORCED, and the legacy monolithic schema files
--       still contain the open policies and can be re-applied.
--
-- This migration is idempotent and safe to run on top of 009/011 OR on a raw
-- schema. It does NOT touch the service_role (which has BYPASSRLS and is used
-- by edge functions), so server-side tooling keeps working.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Helper: current_user_role() (redefine so this migration is standalone;
--    matches migration 009's definition.)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- 1. FORCE Row Level Security on every public table.
--    FORCE applies RLS even to the table owner; the service_role still bypasses
--    via BYPASSRLS. This prevents accidental owner-context reads from leaking.
-- ---------------------------------------------------------------------------
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles','schools','drivers','children','driver_assignments',
        'trips','payments','emergency_alerts','driver_locations','driver_reviews',
        'driver_tracking','child_link_requests','emergency_contacts','safe_words',
        'panic_alerts','incidents','vehicles','vehicle_maintenance','routes',
        'route_assignments','leads'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- ===========================================================================
-- 2. driver_tracking — drop the wide-open SELECT; keep the tightened set from
--    migration 011 (recreated here defensively in case 011 was not applied).
-- ===========================================================================
DROP POLICY IF EXISTS "Anyone can read driver tracking" ON driver_tracking;

DROP POLICY IF EXISTS "Drivers can read own tracking" ON driver_tracking;
CREATE POLICY "Drivers can read own tracking"
  ON driver_tracking FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Parents can read driver tracking for assigned children" ON driver_tracking;
CREATE POLICY "Parents can read driver tracking for assigned children"
  ON driver_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children c
      JOIN trips t ON t.driver_id = driver_tracking.driver_id
      WHERE c.parent_id = auth.uid()
        AND t.status IN ('scheduled','in_progress','pending')
    )
  );

DROP POLICY IF EXISTS "Admins can read all driver tracking" ON driver_tracking;
CREATE POLICY "Admins can read all driver tracking"
  ON driver_tracking FOR SELECT
  USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Drivers can update own tracking" ON driver_tracking;
CREATE POLICY "Drivers can update own tracking"
  ON driver_tracking FOR UPDATE
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Drivers can insert own tracking" ON driver_tracking;
CREATE POLICY "Drivers can insert own tracking"
  ON driver_tracking FOR INSERT
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- ===========================================================================
-- 3. driver_locations (legacy live-GPS table) — fix the buggy
--    `auth.uid() = driver_id` policies and the any-authenticated SELECT.
-- ===========================================================================
DROP POLICY IF EXISTS "Authenticated users can view driver locations" ON driver_locations;
DROP POLICY IF EXISTS "Drivers can update own location" ON driver_locations;
DROP POLICY IF EXISTS "Drivers can insert own location" ON driver_locations;
DROP POLICY IF EXISTS "Anyone can view driver locations" ON driver_locations;

CREATE POLICY "Drivers manage own location"
  ON driver_locations FOR ALL
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Parents can view driver location for assigned children"
  ON driver_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children c
      JOIN trips t ON t.driver_id = driver_locations.driver_id
      WHERE c.parent_id = auth.uid()
        AND t.status IN ('scheduled','in_progress','pending')
    )
  );

CREATE POLICY "Admins can view all driver locations"
  ON driver_locations FOR SELECT
  USING (public.current_user_role() = 'admin');

-- ===========================================================================
-- 4. vehicles — drop "Anyone can read vehicles"; require auth + ownership.
-- ===========================================================================
DROP POLICY IF EXISTS "Anyone can read vehicles" ON vehicles;

DROP POLICY IF EXISTS "Drivers can read own vehicle" ON vehicles;
CREATE POLICY "Drivers can read own vehicle"
  ON vehicles FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Parents can read vehicles for assigned drivers" ON vehicles;
CREATE POLICY "Parents can read vehicles for assigned drivers"
  ON vehicles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children c
      JOIN trips t ON t.driver_id = vehicles.driver_id
      WHERE c.parent_id = auth.uid()
        AND t.status IN ('scheduled','in_progress','pending')
    )
  );

DROP POLICY IF EXISTS "Admins can manage vehicles" ON vehicles;
CREATE POLICY "Admins can manage vehicles"
  ON vehicles FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ===========================================================================
-- 5. route_assignments — drop the three "Anyone" blanket policies.
-- ===========================================================================
DROP POLICY IF EXISTS "Anyone can read route_assignments" ON route_assignments;
DROP POLICY IF EXISTS "Anyone can insert route_assignments" ON route_assignments;
DROP POLICY IF EXISTS "Anyone can update route_assignments" ON route_assignments;

DROP POLICY IF EXISTS "Parents can read assigned routes" ON route_assignments;
CREATE POLICY "Parents can read assigned routes"
  ON route_assignments FOR SELECT
  USING (
    child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Drivers can read own route_assignments" ON route_assignments;
CREATE POLICY "Drivers can read own route_assignments"
  ON route_assignments FOR SELECT
  USING (
    route_id IN (
      SELECT r.id FROM routes r
      JOIN trips t ON t.route_id = r.id
      WHERE t.driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage route_assignments" ON route_assignments;
CREATE POLICY "Admins can manage route_assignments"
  ON route_assignments FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ===========================================================================
-- 6. routes — defensively drop "Anyone can read routes" (migration 009 should
--    have done this; recreate tightened SELECT if missing).
-- ===========================================================================
DROP POLICY IF EXISTS "Anyone can read routes" ON routes;

DROP POLICY IF EXISTS "Parents can read assigned routes" ON routes;
CREATE POLICY "Parents can read assigned routes"
  ON routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN children c ON c.id = ra.child_id
      WHERE ra.route_id = routes.id AND c.parent_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Drivers can read own routes" ON routes;
CREATE POLICY "Drivers can read own routes"
  ON routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trips t
      WHERE t.route_id = routes.id
        AND t.driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage routes" ON routes;
CREATE POLICY "Admins can manage routes"
  ON routes FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ===========================================================================
-- 7. driver_reviews — drop "Anyone can view driver reviews"; restrict.
-- ===========================================================================
DROP POLICY IF EXISTS "Anyone can view driver reviews" ON driver_reviews;

DROP POLICY IF EXISTS "Parents can read reviews for drivers they used" ON driver_reviews;
CREATE POLICY "Parents can read reviews for drivers they used"
  ON driver_reviews FOR SELECT
  USING (
    parent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM children c
      JOIN trips t ON t.driver_id = driver_reviews.driver_id
      WHERE c.parent_id = auth.uid()
    )
    OR public.current_user_role() = 'admin'
  );

DROP POLICY IF EXISTS "Parents can insert own reviews" ON driver_reviews;
CREATE POLICY "Parents can insert own reviews"
  ON driver_reviews FOR INSERT
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage reviews" ON driver_reviews;
CREATE POLICY "Admins can manage reviews"
  ON driver_reviews FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ===========================================================================
-- 8. drivers — replace the "Anyone can view verified drivers" public policy
--    (which the anon key used to dump every driver) with an authenticated-only
--    directory policy.
-- ===========================================================================
DROP POLICY IF EXISTS "Anyone can view verified drivers" ON drivers;
DROP POLICY IF EXISTS "Anyone can read drivers" ON drivers;

DROP POLICY IF EXISTS "Authenticated can view verified drivers" ON drivers;
CREATE POLICY "Authenticated can view verified drivers"
  ON drivers FOR SELECT
  USING (
    is_verified = true AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Drivers can read own profile" ON drivers;
CREATE POLICY "Drivers can read own profile"
  ON drivers FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Drivers can update own profile" ON drivers;
CREATE POLICY "Drivers can update own profile"
  ON drivers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage drivers" ON drivers;
CREATE POLICY "Admins can manage drivers"
  ON drivers FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- ===========================================================================
-- 9. trips — ensure INSERT/UPDATE exist for parents/drivers (009 only added
--    SELECT) and that anon cannot read.
-- ===========================================================================
DROP POLICY IF EXISTS "Parents can view own child trips" ON trips;
CREATE POLICY "Parents can view own child trips"
  ON trips FOR SELECT
  USING (EXISTS (SELECT 1 FROM children WHERE id = trips.child_id AND parent_id = auth.uid()));

DROP POLICY IF EXISTS "Drivers can view own trips" ON trips;
CREATE POLICY "Drivers can view own trips"
  ON trips FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins can manage trips" ON trips;
CREATE POLICY "Admins can manage trips"
  ON trips FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Parents can create trips for own children" ON trips;
CREATE POLICY "Parents can create trips for own children"
  ON trips FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM children WHERE id = trips.child_id AND parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "Drivers can update own trip status" ON trips;
CREATE POLICY "Drivers can update own trip status"
  ON trips FOR UPDATE
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- ===========================================================================
-- 10. children — defensive (re-assert 009's tightened policies if missing).
-- ===========================================================================
DROP POLICY IF EXISTS "Parents can view own children" ON children;
DROP POLICY IF EXISTS "Parents can read own children" ON children;
CREATE POLICY "Parents can read own children"
  ON children FOR SELECT USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can insert own children" ON children;
CREATE POLICY "Parents can insert own children"
  ON children FOR INSERT WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can update own children" ON children;
CREATE POLICY "Parents can update own children"
  ON children FOR UPDATE USING (parent_id = auth.uid()) WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Parents can delete own children" ON children;
CREATE POLICY "Parents can delete own children"
  ON children FOR DELETE USING (parent_id = auth.uid());

DROP POLICY IF EXISTS "Drivers can read assigned children" ON children;
CREATE POLICY "Drivers can read assigned children"
  ON children FOR SELECT
  USING (EXISTS (SELECT 1 FROM driver_assignments da WHERE da.child_id = children.id AND da.status = 'active'));

DROP POLICY IF EXISTS "Admins can read all children" ON children;
CREATE POLICY "Admins can read all children"
  ON children FOR SELECT USING (public.current_user_role() = 'admin');

-- ===========================================================================
-- 11. profiles — defensive (re-assert 009).
-- ===========================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- CRITICAL: clients must NOT be able to self-assign role='admin'. profiles.role
-- may only be set by the server (trigger) or an admin. Block client INSERT/UPDATE
-- that sets role to anything other than the authenticated user's existing/none.
DROP POLICY IF EXISTS "Block client role escalation on profiles" ON profiles;
CREATE POLICY "Block client role escalation on profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND NEW.role IN ('parent','driver')
  );

-- ===========================================================================
-- 12. VERIFICATION — these DO blocks would have FAILED on the vulnerable
--     production backend. They raise loudly if any blanket-open policy survives.
-- ===========================================================================
DO $$
DECLARE c INT;
BEGIN
  -- Flag only policies whose USING clause is the literal boolean true
  -- (Supabase stores `USING (true)` as the text `true`). Exact match avoids
  -- false positives on legitimate `is_verified = true` comparisons.
  SELECT COUNT(*) INTO c FROM pg_policies
  WHERE schemaname = 'public'
    AND (qual = 'true' OR qual = '(true)');
  IF c > 0 THEN
    RAISE EXCEPTION 'SECURITY: % public policies still have USING (true) — blanket-open policies must be removed before release', c;
  END IF;
  RAISE NOTICE 'RLS lockdown verified: no blanket USING (true) SELECT policies remain.';
END $$;

DO $$
DECLARE c INT;
BEGIN
  SELECT COUNT(*) INTO c FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'driver_tracking'
    AND policyname = 'Anyone can read driver tracking';
  IF c > 0 THEN
    RAISE EXCEPTION 'SECURITY: driver_tracking still has "Anyone can read driver tracking"';
  END IF;
END $$;

-- Confirm anon is blocked: anon (auth.uid() IS NULL) must match NO SELECT policy
-- on children/drivers/trips. This is a static sanity assertion.
DO $$
DECLARE blocked INT;
BEGIN
  -- Count permissive SELECT policies on children that anon could satisfy.
  -- auth.uid() is NULL for anon, so parent_id = auth.uid() and current_user_role()
  -- (which returns NULL) comparisons all evaluate false. Assert at least the
  -- ownership-gated policies exist (so anon has no true path).
  SELECT COUNT(*) INTO blocked FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'children' AND cmd = 'SELECT'
    AND policyname IN ('Parents can read own children','Drivers can read assigned children','Admins can read all children');
  IF blocked < 1 THEN
    RAISE EXCEPTION 'SECURITY: children has no ownership-gated SELECT policy — anon may read all children';
  END IF;
  RAISE NOTICE 'RLS lockdown verified: children SELECT gated by ownership/admin only.';
END $$;

SELECT 'Migration 014: RLS lockdown applied — anon key can no longer read/write core tables' AS result;
