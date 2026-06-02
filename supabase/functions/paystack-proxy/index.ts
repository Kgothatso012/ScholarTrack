// Supabase Edge Function: Paystack Proxy
// Wraps all Paystack API calls server-side so the secret key never reaches the client.
// Deploy with: supabase functions deploy paystack-proxy
// Requires PAYSTACK_SECRET_KEY environment variable in Supabase.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

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

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').filter(Boolean).pop() || '';

    // Body forwarded as-is for POST; query string is ignored.
    const body = req.method === 'POST' ? await req.text() : undefined;

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

    // For verify/bin: append the trailing id segment passed in the body
    // as { id: ... } to keep the action signature uniform.
    let target = cfg.target;
    if (action === 'verify' || action === 'bin') {
      let idParam = '';
      try {
        const parsed = body ? JSON.parse(body) : {};
        idParam = parsed.id || '';
      } catch {
        // ignore parse errors; verify will fail with 404 if no id
      }
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
