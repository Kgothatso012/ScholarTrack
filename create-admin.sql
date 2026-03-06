-- Create admin users for Elder and Kg
-- Run in Supabase SQL Editor

-- Insert admin profiles (use your actual Supabase user IDs after you register via the app)

-- For now, let's make the existing test accounts admins:
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@test.com';

-- If you register new accounts, use these emails and run:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
