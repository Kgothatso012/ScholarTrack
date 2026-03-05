-- ScholarTrack Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- 1. Driver Tracking Table for GPS Location
CREATE TABLE IF NOT EXISTS driver_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(6, 2),
  heading DECIMAL(5, 2),
  accuracy DECIMAL(5, 2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'idle', 'offline')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying driver's latest location
CREATE INDEX idx_driver_tracking_driver ON driver_tracking(driver_id);
CREATE INDEX idx_driver_tracking_last_updated ON driver_tracking(last_updated DESC);

-- 2. Child Link Requests Table (if not exists)
CREATE TABLE IF NOT EXISTS child_link_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  request_type TEXT DEFAULT 'parent_request' CHECK (request_type IN ('parent_request', 'admin_assign')),
  requested_by UUID NOT NULL,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Trips Table Enhancement
ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_location_lat DECIMAL(10, 8);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS pickup_location_lng DECIMAL(11, 8);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS dropoff_location_lat DECIMAL(10, 8);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS dropoff_location_lng DECIMAL(11, 8);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_pickup_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS actual_dropoff_time TIMESTAMP WITH TIME ZONE;

-- 5. Payment Table Enhancement
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'monthly' CHECK (payment_type IN ('monthly', 'one-time', 'deposit'));
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference TEXT UNIQUE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id);

-- 6. Safe Words for Children
CREATE TABLE IF NOT EXISTS safe_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Panic Alerts Table
CREATE TABLE IF NOT EXISTS panic_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id),
  alert_type TEXT DEFAULT 'manual' CHECK (alert_type IN ('manual', 'safe_word', 'geofence')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'cancelled')),
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Incident Reports Table Enhancement
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS trip_id UUID REFERENCES trips(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES children(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);

-- 9. Driver Assignments Enhancement
ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS route_id UUID REFERENCES routes(id);
ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10, 2);
ALTER TABLE driver_assignments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending'));

-- Enable Row Level Security
ALTER TABLE driver_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_link_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE panic_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_tracking
DROP POLICY IF EXISTS "Anyone can read driver tracking" ON driver_tracking;
CREATE POLICY "Anyone can read driver tracking" ON driver_tracking FOR SELECT USING (true);

DROP POLICY IF EXISTS "Drivers can update own tracking" ON driver_tracking;
CREATE POLICY "Drivers can update own tracking" ON driver_tracking FOR UPDATE USING (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Drivers can insert own tracking" ON driver_tracking;
CREATE POLICY "Drivers can insert own tracking" ON driver_tracking FOR INSERT WITH CHECK (
  driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
);

-- RLS Policies for emergency_contacts
DROP POLICY IF EXISTS "Users manage own emergency contacts" ON emergency_contacts;
CREATE POLICY "Users manage own emergency contacts" ON emergency_contacts FOR ALL USING (
  user_id = auth.uid()
);

-- RLS Policies for child_link_requests
DROP POLICY IF EXISTS "Parents can view own requests" ON child_link_requests;
CREATE POLICY "Parents can view own requests" ON child_link_requests FOR SELECT USING (
  parent_id = auth.uid() OR requested_by = auth.uid()
);

DROP POLICY IF EXISTS "Admins can manage all requests" ON child_link_requests;
CREATE POLICY "Admins can manage all requests" ON child_link_requests FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- RLS Policies for panic_alerts
DROP POLICY IF EXISTS "Users can manage own panic alerts" ON panic_alerts;
CREATE POLICY "Users can manage own panic alerts" ON panic_alerts FOR ALL USING (
  user_id = auth.uid()
);

DROP POLICY IF EXISTS "Admins can view all panic alerts" ON panic_alerts;
CREATE POLICY "Admins can view all panic alerts" ON panic_alerts FOR SELECT USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

-- RLS Policies for safe_words
DROP POLICY IF EXISTS "Parents can manage child safe words" ON safe_words;
CREATE POLICY "Parents can manage child safe words" ON safe_words FOR ALL USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_child_link_requests_updated_at ON child_link_requests;
CREATE TRIGGER update_child_link_requests_updated_at
  BEFORE UPDATE ON child_link_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_safe_words_updated_at ON safe_words;
CREATE TRIGGER update_safe_words_updated_at
  BEFORE UPDATE ON safe_words
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert sample data for testing (optional)
-- INSERT INTO emergency_contacts (user_id, name, phone, relationship, is_primary)
-- SELECT id, 'Primary Contact', '+27821234567', 'Parent', true
-- FROM profiles WHERE role = 'parent' LIMIT 5;

SELECT 'Database schema setup complete!' as result;

-- Trip Check-ins Table (for student check-in during trips)
CREATE TABLE IF NOT EXISTS trip_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  checked_out_at TIMESTAMP WITH TIME ZONE,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE trip_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Drivers can manage trip checkins" ON trip_checkins;
CREATE POLICY "Drivers can manage trip checkins" ON trip_checkins FOR ALL USING (
  trip_id IN (SELECT id FROM trips WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()))
);

-- Index
CREATE INDEX idx_trip_checkins_trip ON trip_checkins(trip_id);
