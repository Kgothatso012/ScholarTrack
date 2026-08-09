// Supabase Edge Function: cleanup-retention
// ----------------------------------------------------------------------------
// Enforces the retention periods stated in legal/PRIVACY_POLICY.md so the
// policy matches reality and the driver_tracking table does not grow
// unbounded (the combined review flagged both).
//
//   - driver_tracking rows older than 90 days   -> delete
//   - completed/cancelled trips older than 12 months -> delete
//   - (leads handled by the existing cleanup-leads function: 6 months)
//
// Schedule it as a Supabase cron job (e.g. daily):
//   supabase functions deploy cleanup-retention
//   then add a cron schedule in the dashboard or via pg_cron invoking the
//   function's webhook. Runs with the service role (BYPASSRLS).
//
// Can also be invoked manually (POST) for an ad-hoc sweep.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const CORS_HEADERS = { 'Content-Type': 'application/json' };

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

const TRACKING_RETENTION_DAYS = 90;
const TRIP_RETENTION_MONTHS = 12;

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('cleanup-retention: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return json({ error: 'Server not configured' }, 500);
  }

  // Allow either a cron invocation (no body) or a manual POST.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const trackingCutoff = new Date(Date.now() - TRACKING_RETENTION_DAYS * 86400000).toISOString();
  const tripCutoff = new Date(Date.now() - TRIP_RETENTION_MONTHS * 30 * 86400000).toISOString();

  try {
    // 1. Delete old driver_tracking rows.
    let trackingDeleted = 0;
    let trackingErr: string | null = null;
    for (let pass = 0; pass < 20; pass++) {
      const { data, error } = await admin
        .from('driver_tracking')
        .delete()
        .lt('last_updated', trackingCutoff)
        .select('id', { count: 'exact', head: false })
        .limit(5000);
      if (error) { trackingErr = error.message; break; }
      const n = data?.length ?? 0;
      trackingDeleted += n;
      if (n < 5000) break; // drained
    }

    // 2. Delete old completed/cancelled trips.
    const { count: tripsCount, error: tripsErr } = await admin
      .from('trips')
      .delete({ count: 'exact' })
      .in('status', ['completed', 'cancelled'])
      .lt('created_at', tripCutoff);

    if (trackingErr) {
      return json({ error: 'driver_tracking cleanup failed', detail: trackingErr, trackingDeleted, tripsDeleted: tripsCount ?? 0 }, 500);
    }
    if (tripsErr) {
      return json({ error: 'trips cleanup failed', detail: tripsErr.message, trackingDeleted, tripsDeleted: 0 }, 500);
    }

    console.log(`cleanup-retention: trackingDeleted=${trackingDeleted} tripsDeleted=${tripsCount ?? 0}`);
    return json({
      success: true,
      trackingDeleted,
      trackingCutoff,
      tripsDeleted: tripsCount ?? 0,
      tripCutoff,
    });
  } catch (error) {
    console.error('cleanup-retention: unexpected error', error);
    return json({ error: 'Unexpected server error' }, 500);
  }
});
