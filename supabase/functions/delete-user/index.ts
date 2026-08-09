// Supabase Edge Function: delete-user
// ----------------------------------------------------------------------------
// POPIA §24 right to erasure — full account deletion.
//
// The client can run delete_user_cascade(uid) (an RLS-gated RPC) to purge the
// user's data, but it CANNOT remove the auth.users row (no admin API from the
// client). This service-role function closes that gap: it verifies the caller,
// purges all of the user's data + writes a deleted_accounts audit row (via the
// delete_user_cascade RPC), then removes the auth user entirely.
//
// Deploy with: supabase functions deploy delete-user
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in function secrets.
//
// Called by the app via: supabase.functions.invoke('delete-user')
//   (forwards the user's access token in the Authorization header).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: CORS_HEADERS });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('delete-user: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return json({ error: 'Server not configured' }, 500);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    // Caller's own client — used only to identify the user, not for the work.
    const caller = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY') || '', {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: callerData, error: callerErr } = await caller.auth.getUser();
    if (callerErr || !callerData?.user) return json({ error: 'Unauthorized' }, 401);
    const callerUid = callerData.user.id;

    // Optional body { user_id } to delete a different user; only an admin may
    // do that. Default to the caller's own account.
    let targetUid = callerUid;
    let role = 'parent';
    try {
      const body = await req.clone().json().catch(() => ({}));
      if (body?.user_id && body.user_id !== callerUid) {
        const { data: profile } = await caller
          .from('profiles')
          .select('role')
          .eq('id', callerUid)
          .maybeSingle();
        role = profile?.role ?? 'parent';
        if (role !== 'admin') return json({ error: 'Forbidden' }, 403);
        targetUid = body.user_id;
      }
    } catch { /* no body — delete own account */ }

    // Service-role client — bypasses RLS for the cascade + auth admin delete.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Purge the user's data and write the audit row.
    const { error: cascadeErr } = await admin.rpc('delete_user_cascade', { p_uid: targetUid });
    if (cascadeErr) {
      console.error('delete-user: cascade failed', cascadeErr.message);
      return json({ error: 'Failed to erase user data', detail: cascadeErr.message }, 500);
    }

    // 2. Remove the auth.users row.
    const { error: delErr } = await admin.auth.admin.deleteUser(targetUid);
    if (delErr) {
      console.error('delete-user: auth delete failed', delErr.message);
      // Data is already purged + audited; the orphaned auth row can be retried.
      return json({ error: 'Data erased but auth account removal failed', detail: delErr.message }, 500);
    }

    return json({ success: true, user_id: targetUid });
  } catch (error) {
    console.error('delete-user: unexpected error', error);
    return json({ error: 'Unexpected server error' }, 500);
  }
});
