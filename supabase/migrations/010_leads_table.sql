-- Migration 010: Marketing leads table
-- Stores submissions from the scholartrack-website landing page form.
-- Used by the submit-lead Edge Function.

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('parent', 'driver')),
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  area text,
  car text,
  children int,
  source text NOT NULL DEFAULT 'scholartrack-website',
  user_agent text,
  ip text,
  -- Pipeline state
  contacted boolean NOT NULL DEFAULT false,
  contacted_at timestamptz,
  converted boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_role ON leads(role);
CREATE INDEX IF NOT EXISTS idx_leads_contacted ON leads(contacted) WHERE contacted = false;

-- RLS: only service_role can read/write leads (admin/internal access).
-- Edge Function uses service_role key.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- No policies on leads table for anon/authenticated roles.
-- Only service_role (used by the Edge Function) can access.
-- This is the default with RLS enabled and no policies = deny all.

SELECT 'Migration 010: leads table created' AS result;
