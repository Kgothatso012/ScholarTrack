-- ScholarTrack Supplemental Migration - New Tables Only

-- Driver Tracking Table
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

-- Child Link Requests Table
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

-- Emergency Contacts Table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safe Words Table
CREATE TABLE IF NOT EXISTS safe_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Panic Alerts Table
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

-- Trip Check-ins Table
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
ALTER TABLE driver_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_link_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE panic_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using OR REPLACE)
DROP POLICY IF EXISTS "Anyone can read driver tracking" ON driver_tracking;
CREATE POLICY "Anyone can read driver tracking" ON driver_tracking FOR SELECT USING (true);

DROP POLICY IF EXISTS "Drivers can update own tracking" ON driver_tracking;
CREATE POLICY "Drivers can update own tracking" ON driver_tracking FOR UPDATE USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Drivers can insert own tracking" ON driver_tracking;
CREATE POLICY "Drivers can insert own tracking" ON driver_tracking FOR INSERT WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users manage own emergency contacts" ON emergency_contacts;
CREATE POLICY "Users manage own emergency contacts" ON emergency_contacts FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Parents can view own requests" ON child_link_requests;
CREATE POLICY "Parents can view own requests" ON child_link_requests FOR SELECT USING (parent_id = auth.uid() OR requested_by = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all requests" ON child_link_requests;
CREATE POLICY "Admins can manage all requests" ON child_link_requests FOR ALL USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Users can manage own panic alerts" ON panic_alerts;
CREATE POLICY "Users can manage own panic alerts" ON panic_alerts FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all panic alerts" ON panic_alerts;
CREATE POLICY "Admins can view all panic alerts" ON panic_alerts FOR SELECT USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Parents can manage child safe words" ON safe_words;
CREATE POLICY "Parents can manage child safe words" ON safe_words FOR ALL USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

DROP POLICY IF EXISTS "Drivers can manage trip checkins" ON trip_checkins;
CREATE POLICY "Drivers can manage trip checkins" ON trip_checkins FOR ALL USING (trip_id IN (SELECT id FROM trips WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_driver_tracking_driver ON driver_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_tracking_last_updated ON driver_tracking(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_trip_checkins_trip ON trip_checkins(trip_id);

SELECT 'Supplemental migration complete!' as result;
