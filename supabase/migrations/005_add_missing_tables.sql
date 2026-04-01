-- Add missing tables: driver_assignments, route_assignments, and fix trips

-- Driver Assignments Table (links drivers to children)
CREATE TABLE IF NOT EXISTS driver_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  start_date DATE DEFAULT CURRENT_DATE,
  monthly_rate DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read driver_assignments" ON driver_assignments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert driver_assignments" ON driver_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update driver_assignments" ON driver_assignments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete driver_assignments" ON driver_assignments FOR DELETE USING (true);

-- Fix trips table - grant proper access
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create policies for trips
CREATE POLICY "Anyone can read trips" ON trips FOR SELECT USING (true);
CREATE POLICY "Anyone can insert trips" ON trips FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update trips" ON trips FOR UPDATE USING (true);

-- Fix route_assignments table if it exists but not exposed
ALTER TABLE route_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for route_assignments
CREATE POLICY "Anyone can read route_assignments" ON route_assignments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert route_assignments" ON route_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update route_assignments" ON route_assignments FOR UPDATE USING (true);