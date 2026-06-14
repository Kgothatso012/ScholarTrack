-- Migration 012: Add child_id to trips table
-- Issue from scholar doctor: src/lib/services/trip.ts:getTripsForChild
-- returned [] because the trips table had no child_id FK. Parents saw
-- empty trip history for their children.
--
-- Plan: add child_id (nullable for backward compat with existing rows),
-- add FK to children(id), add an index, update the service to filter
-- by child_id, and backfill from student_name where possible.
--
-- This is a 2-step migration:
--   1. ALTER TABLE trips ADD COLUMN child_id UUID REFERENCES children(id);
--   2. UPDATE trips SET child_id = (SELECT id FROM children WHERE full_name = trips.student_name LIMIT 1)
--      WHERE child_id IS NULL AND student_name IS NOT NULL;

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_trips_child_id ON trips(child_id) WHERE child_id IS NOT NULL;

-- Backfill from student_name where possible. If student_name doesn't
-- match a child, child_id stays NULL (the trip is for an unknown child,
-- e.g. legacy data or a multi-child trip).
UPDATE trips
SET child_id = (
  SELECT id FROM children
  WHERE children.full_name = trips.student_name
  LIMIT 1
)
WHERE child_id IS NULL
  AND student_name IS NOT NULL
  AND EXISTS (SELECT 1 FROM children WHERE children.full_name = trips.student_name);

-- RLS: parents can read trips for their own children
DROP POLICY IF EXISTS "Parents can read trips for own children" ON trips;
CREATE POLICY "Parents can read trips for own children"
  ON trips FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = trips.child_id AND children.parent_id = auth.uid())
  );

-- Drivers can read their own trips (existing)
DROP POLICY IF EXISTS "Drivers can read own trips" ON trips;
CREATE POLICY "Drivers can read own trips"
  ON trips FOR SELECT
  USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Admins can read all (existing via current_user_role)
DROP POLICY IF EXISTS "Admins can read all trips" ON trips;
CREATE POLICY "Admins can read all trips"
  ON trips FOR SELECT
  USING (public.current_user_role() = 'admin');

SELECT 'Migration 012: trips.child_id added and RLS wired' AS result;
