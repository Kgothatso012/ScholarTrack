-- Add missing columns to payments table for Paystack integration
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS method TEXT;

-- Update the CHECK constraint to include 'paid' status (already there)
-- No data migration needed as new columns have defaults
