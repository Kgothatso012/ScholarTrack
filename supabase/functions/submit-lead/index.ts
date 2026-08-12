// Supabase Edge Function: Submit Lead
// Persists marketing-site form submissions to a `leads` table.
// Deploy with: supabase functions deploy submit-lead
//
// Expected payload from malumescholartrack-website form:
//   {
//     role: 'parent' | 'driver',
//     name: string,
//     email: string,
//     phone: string,
//     area?: string,
//     car?: string,
//     children?: number,
//     timestamp: ISO string,
//     source: 'malumescholartrack-website'
//   }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface LeadPayload {
  role?: string;
  name?: string;
  email?: string;
  phone?: string;
  area?: string;
  car?: string;
  children?: number | string;
  timestamp?: string;
  source?: string;
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function isValidPhone(s: string): boolean {
  // SA + international: digits, +, spaces, dashes
  return /^[+\d\s()-]{7,20}$/.test(s);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: CORS_HEADERS }
    );
  }

  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }

  // Validate required fields
  if (!body.name || body.name.trim().length < 2) {
    return new Response(
      JSON.stringify({ error: 'name is required (min 2 chars)' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }
  if (!body.email || !isValidEmail(body.email)) {
    return new Response(
      JSON.stringify({ error: 'valid email is required' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }
  if (!body.phone || !isValidPhone(body.phone)) {
    return new Response(
      JSON.stringify({ error: 'valid phone is required' }),
      { status: 400, headers: CORS_HEADERS }
    );
  }
  const role = body.role === 'driver' ? 'driver' : 'parent';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Submit-lead: missing Supabase server env' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Insert lead
  const row = {
    role,
    name: body.name.trim().slice(0, 200),
    email: body.email.trim().toLowerCase().slice(0, 254),
    phone: body.phone.trim().slice(0, 32),
    area: body.area ? body.area.trim().slice(0, 120) : null,
    car: body.car ? body.car.trim().slice(0, 120) : null,
    children:
      body.children === undefined || body.children === null
        ? null
        : Math.max(1, Math.min(10, Number(body.children) || 0)),
    source: body.source || 'malumescholartrack-website',
    user_agent: req.headers.get('user-agent')?.slice(0, 300) || null,
    ip:
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null,
  };

  const { data, error } = await supabase.from('leads').insert(row).select('id').single();
  if (error) {
    return new Response(
      JSON.stringify({ error: `Failed to save lead: ${error.message}` }),
      { status: 500, headers: CORS_HEADERS }
    );
  }

  return new Response(
    JSON.stringify({ ok: true, id: data.id }),
    { status: 200, headers: CORS_HEADERS }
  );
});
