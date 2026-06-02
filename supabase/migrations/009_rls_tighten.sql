-- Migration 009: Tighten RLS policies
-- Issue #3 from codex security review:
-- "Anyone can read X" policies are too permissive.
-- This migration narrows SELECT to role-appropriate callers and adds WITH CHECK
-- on all mutating statements to enforce ownership.

-- Helper: current user's role (cached per statement)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;

-- =====================================================
-- profiles: anyone authed can read; only owner can update;
-- only the owner can insert (signup flow)
-- =====================================================
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- children: parents see their own; drivers see assigned children;
-- admins see all; nobody else
-- =====================================================
DROP POLICY IF EXISTS "Parents can read own children" ON children;
DROP POLICY IF EXISTS "Drivers can read assigned children" ON children;
DROP POLICY IF EXISTS "Admins can read all children" ON children;

CREATE POLICY "Parents can read own children"
  ON children FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Drivers can read assigned children"
  ON children FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN trips t ON t.route_id = ra.route_id
      WHERE ra.child_id = children.id
        AND t.driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can read all children"
  ON children FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Parents can insert own children"
  ON children FOR INSERT
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update own children"
  ON children FOR UPDATE
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can delete own children"
  ON children FOR DELETE
  USING (parent_id = auth.uid());

-- =====================================================
-- drivers: parents who have an active trip see that driver;
-- drivers see their own row; admins see all
-- (the prior "Anyone can read drivers WHERE is_verified=true"
--  policy stays so verified drivers remain visible to parents
--  browsing the directory. We just remove the bare public blanket.)
-- =====================================================
-- Keep: "Anyone can read drivers" where is_verified = true
-- It already filters to verified drivers only.

CREATE POLICY "Drivers can update own driver row"
  ON drivers FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Drivers can insert own driver row"
  ON drivers FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- routes: parents see routes their children are assigned to;
-- drivers see their own routes; admins see all
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read routes" ON routes;

CREATE POLICY "Parents can read assigned routes"
  ON routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN children c ON c.id = ra.child_id
      WHERE ra.route_id = routes.id
        AND c.parent_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can read own routes"
  ON routes FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can read all routes"
  ON routes FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Drivers can manage own routes"
  ON routes FOR ALL
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- =====================================================
-- route_stops: same scoping as routes
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read route_stops" ON route_stops;

CREATE POLICY "Parents can read stops on assigned routes"
  ON route_stops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN children c ON c.id = ra.child_id
      WHERE ra.route_id = route_stops.route_id
        AND c.parent_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can read own route stops"
  ON route_stops FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM routes r
      WHERE r.id = route_stops.route_id
        AND r.driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can read all route stops"
  ON route_stops FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Drivers can manage own route stops"
  ON route_stops FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM routes r
      WHERE r.id = route_stops.route_id
        AND r.driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routes r
      WHERE r.id = route_stops.route_id
        AND r.driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    )
  );

-- =====================================================
-- route_assignments: parents see their own; drivers see their route's
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read route_assignments" ON route_assignments;

CREATE POLICY "Parents can read own route assignments"
  ON route_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM children c
      WHERE c.id = route_assignments.child_id
        AND c.parent_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can read own route assignments"
  ON route_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM routes r
      WHERE r.id = route_assignments.route_id
        AND r.driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can read all route assignments"
  ON route_assignments FOR SELECT
  USING (public.current_user_role() = 'admin');

-- =====================================================
-- trips: parents see trips for their children; drivers see their own
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read trips" ON trips;

CREATE POLICY "Parents can read trips for own children"
  ON trips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN children c ON c.id = ra.child_id
      WHERE ra.route_id = trips.route_id
        AND c.parent_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can read own trips"
  ON trips FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can read all trips"
  ON trips FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Drivers can manage own trips"
  ON trips FOR ALL
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- =====================================================
-- incidents: same scoping as trips
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read incidents" ON incidents;

CREATE POLICY "Parents can read incidents on assigned trips"
  ON incidents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM route_assignments ra
      JOIN children c ON c.id = ra.child_id
      WHERE ra.route_id = incidents.route_id
        AND c.parent_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can read own incidents"
  ON incidents FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can read all incidents"
  ON incidents FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Drivers can insert own incidents"
  ON incidents FOR INSERT
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- =====================================================
-- driver_documents: only the driver themselves + admin can read;
-- storage policies in migration 004 already gate by storage folder
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read driver documents" ON driver_documents;

CREATE POLICY "Drivers can read own documents"
  ON driver_documents FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Admins can read all driver documents"
  ON driver_documents FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Drivers can manage own documents"
  ON driver_documents FOR ALL
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- =====================================================
-- parent_documents: only the parent + admin can read
-- =====================================================
DROP POLICY IF EXISTS "Anyone can read parent documents" ON parent_documents;

CREATE POLICY "Parents can read own parent documents"
  ON parent_documents FOR SELECT
  USING (parent_id = auth.uid());

CREATE POLICY "Admins can read all parent documents"
  ON parent_documents FOR SELECT
  USING (public.current_user_role() = 'admin');

CREATE POLICY "Parents can manage own parent documents"
  ON parent_documents FOR ALL
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- =====================================================
-- payments: tighten inserts/updates (only the parent can create a
-- payment record; drivers update their own payout records)
-- =====================================================
DROP POLICY IF EXISTS "Parents can insert own payments" ON payments;
CREATE POLICY "Parents can insert own payments"
  ON payments FOR INSERT
  WITH CHECK (parent_id = auth.uid());

DROP POLICY IF EXISTS "Drivers can update own payments" ON payments;
CREATE POLICY "Drivers can update own payments"
  ON payments FOR UPDATE
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
  WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- =====================================================
-- driver_assignments: drop the bare "anyone can insert" policy
-- in migration 005. Only admins can assign drivers to routes.
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert driver_assignments" ON driver_assignments;
DROP POLICY IF EXISTS "Anyone can read driver_assignments" ON driver_assignments;

CREATE POLICY "Admins can manage driver_assignments"
  ON driver_assignments FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- =====================================================
-- Make sure RLS stays enabled on every table
-- =====================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'profiles','schools','children','drivers','routes','route_stops',
      'route_assignments','trips','payments','incidents','driver_documents',
      'parent_documents','driver_assignments','driver_tracking',
      'emergency_contacts','child_link_requests','panic_alerts','safe_words',
      'trip_checkins','driver_ratings','route_passengers'
    ])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

SELECT 'Migration 009: RLS tightened' AS result;
