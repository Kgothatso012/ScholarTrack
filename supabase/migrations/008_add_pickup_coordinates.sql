-- Add pickup coordinates to children table for real ETA calculation
ALTER TABLE children ADD COLUMN IF NOT EXISTS pickup_lat DECIMAL(10, 8);
ALTER TABLE children ADD COLUMN IF NOT EXISTS pickup_lng DECIMAL(11, 8);

-- Add school coordinates for distance calculation
ALTER TABLE schools ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE schools ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- RLS policy for school coordinates (read-only for parents/drivers)
DROP POLICY IF EXISTS "Parents can view school coordinates" ON schools;
CREATE POLICY "Parents can view school coordinates" ON schools FOR SELECT USING (true);

-- RLS policy for children coordinates (parents can update own children's coordinates)
DROP POLICY IF EXISTS "Parents can update own child pickup coordinates" ON children;
CREATE POLICY "Parents can update own child pickup coordinates" ON children FOR UPDATE USING (parent_id = auth.uid()) FOR SELECT USING (true);

SELECT 'Added pickup and school coordinates to children and schools tables' as result;