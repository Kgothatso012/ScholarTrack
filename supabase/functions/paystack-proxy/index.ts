// Supabase Edge Function: Paystack Proxy
// Wraps all Paystack API calls server-side so the secret key never reaches the client.
// Deploy with: supabase functions deploy paystack-proxy
// Requires PAYSTACK_SECRET_KEY environment variable in Supabase.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (!PAYSTACK_SECRET_KEY) {
    return new Response(
      JSON.stringify({ error: 'PAYSTACK_SECRET_KEY not configured' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }

  // --- JWT verification: reject unauthenticated callers ---
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized or server not configured' }),
      { status: 401, headers: CORS_HEADERS }
    );
  }
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: callerData, error: callerErr } = await callerClient.auth.getUser();
  if (callerErr || !callerData?.user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: CORS_HEADERS }
    );
  }

  try {
    // The client sends { action: 'initialize', ...paystackFields } in the body.
    const rawBody = await req.text();
    let parsed: Record<string, unknown> = {};
    try { parsed = rawBody ? JSON.parse(rawBody) : {}; } catch { /* empty body for GET-style actions */ }
    const action = (parsed.action as string) || '';
    // Strip the action field before forwarding to Paystack.
    const { action: _stripped, ...paystackBody } = parsed;
    const body = Object.keys(paystackBody).length > 0 ? JSON.stringify(paystackBody) : undefined;

    // Map our action names to Paystack endpoints.
    const route: Record<string, { method: string; target: string; allowGet?: boolean }> = {
      'initialize':     { method: 'POST',   target: '/transaction/initialize' },
      'verify':         { method: 'GET',    target: '/transaction/verify/' },
      'bin':            { method: 'GET',    target: '/decision/bin/' },
      'charge':         { method: 'POST',   target: '/transaction/charge_authorization' },
      'customer':       { method: 'POST',   target: '/customer' },
      'transactions':   { method: 'GET',    target: '/transaction' },
      'refund':         { method: 'POST',   target: '/refund' },
    };

    const cfg = route[action];
    if (!cfg) {
      return new Response(
        JSON.stringify({ error: `Unknown action: ${action}` }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // For verify/bin: append the id from the body to the target URL.
    let target = cfg.target;
    if (action === 'verify' || action === 'bin') {
      const idParam = String(parsed.id || '');
      if (idParam) target = `${target}${encodeURIComponent(idParam)}`;
    }

    const upstream = await fetch(`${PAYSTACK_BASE_URL}${target}`, {
      method: cfg.method,
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: cfg.method === 'POST' ? body : undefined,
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: CORS_HEADERS,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message || 'Paystack proxy error' }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
});
