-- ScholarTrack Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'driver', 'admin')),
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_number TEXT,
  vehicle_type TEXT,
  license_number TEXT,
  permit_number TEXT,
  -- Compliance Status Fields (Uber/inDrive style)
  is_verified BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT false,
  rating FLOAT DEFAULT 5.0,
  total_trips INTEGER DEFAULT 0,
  -- Compliance Document Status
  id_copy_status TEXT DEFAULT 'pending' CHECK (id_copy_status IN ('pending', 'submitted', 'approved', 'rejected')),
  profile_photo_status TEXT DEFAULT 'pending' CHECK (profile_photo_status IN ('pending', 'submitted', 'approved', 'rejected')),
  pdp_status TEXT DEFAULT 'pending' CHECK (pdp_status IN ('pending', 'submitted', 'approved', 'rejected')),
  drivers_license_status TEXT DEFAULT 'pending' CHECK (drivers_license_status IN ('pending', 'submitted', 'approved', 'rejected')),
  criminal_check_status TEXT DEFAULT 'pending' CHECK (criminal_check_status IN ('pending', 'submitted', 'approved', 'rejected')),
  roadworthy_status TEXT DEFAULT 'pending' CHECK (roadworthy_status IN ('pending', 'submitted', 'approved', 'rejected')),
  insurance_status TEXT DEFAULT 'pending' CHECK (insurance_status IN ('pending', 'submitted', 'approved', 'rejected')),
  operating_license_status TEXT DEFAULT 'pending' CHECK (operating_license_status IN ('pending', 'submitted', 'approved', 'rejected')),
  compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'under_review', 'approved', 'rejected')),
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles table for driver fleet
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  license_plate TEXT NOT NULL,
  vin_number TEXT,
  vehicle_type TEXT DEFAULT 'sedan',
  -- Vehicle Compliance
  roadworthy_expiry DATE,
  insurance_expiry DATE,
  license_disc_expiry DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Children table
CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  grade TEXT,
  pickup_address TEXT,
  pickup_lat FLOAT,
  pickup_lng FLOAT,
  dropoff_address TEXT,
  dropoff_lat FLOAT,
  dropoff_lng FLOAT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver assignments (hire driver for child)
CREATE TABLE IF NOT EXISTS public.driver_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  monthly_rate FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_time TIMESTAMP WITH TIME ZONE,
  pickup_time TIMESTAMP WITH TIME ZONE,
  dropoff_time TIMESTAMP WITH TIME ZONE,
  pickup_location TEXT,
  dropoff_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  amount FLOAT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  month TEXT NOT NULL,
  reference TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency alerts table
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('panic', 'incident', 'medical', 'other')),
  description TEXT,
  location_lat FLOAT,
  location_lng FLOAT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Driver locations (real-time tracking)
CREATE TABLE IF NOT EXISTS public.driver_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Children policies
CREATE POLICY "Parents can view own children" ON children FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Parents can insert own children" ON children FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Parents can update own children" ON children FOR UPDATE USING (parent_id = auth.uid());
CREATE POLICY "Drivers can view assigned children" ON children FOR SELECT USING (
  EXISTS (SELECT 1 FROM driver_assignments WHERE child_id = children.id AND status = 'active')
);

-- Drivers policies
CREATE POLICY "Anyone can view verified drivers" ON drivers FOR SELECT USING (is_verified = true);
CREATE POLICY "Drivers can update own profile" ON drivers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can manage drivers" ON drivers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Trips policies
CREATE POLICY "Parents can view own child trips" ON trips FOR SELECT USING (
  EXISTS (SELECT 1 FROM children WHERE id = trips.child_id AND parent_id = auth.uid())
);
CREATE POLICY "Drivers can view own trips" ON trips FOR SELECT USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Payments policies
CREATE POLICY "Parents can view own payments" ON payments FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Drivers can view own payments" ON payments FOR SELECT USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'parent'),
    NEW.raw_user_meta_data->>'full_name'
  );
  
  -- If driver, create driver record
  IF NEW.raw_user_meta_data->>'role' = 'driver' THEN
    INSERT INTO public.drivers (user_id, full_name, phone)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample schools
INSERT INTO schools (name, address) VALUES
  ('Mamelodi High School', 'Mamelodi, Pretoria'),
  ('St. Martins Primary', 'St. Martins, Johannesburg'),
  ('Pretoria Girls High', 'Pretoria'),
  ('Johannesburg Muslim School', 'Johannesburg')
ON CONFLICT DO NOTHING;

-- Insert sample drivers
INSERT INTO drivers (full_name, phone, vehicle_type, is_verified, is_available, rating)
VALUES
  ('John Molaba', '+27811234567', 'Toyota Quantum', true, true, 4.8),
  ('Sarah Khan', '+27829876543', 'Mercedes Vito', true, true, 4.9),
  ('Mike Johnson', '+27834567890', 'Honda Accord', false, false, 4.5)
ON CONFLICT DO NOTHING;
