// Supabase Edge Function: cleanup-leads
// Daily cron job: deletes leads older than 90 days. POPIA retention limit.
//
// Schedule: supabase functions deploy cleanup-leads
//   Then: supabase functions schedule create cleanup-leads '0 2 * * *' \
//     --command 'select 1'
// (or use the dashboard's Database > Cron Jobs in Supabase)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RETENTION_DAYS = 90;

Deno.serve(async () => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("cleanup-leads: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return new Response(
      JSON.stringify({ error: "Server not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabaseAdmin
    .from("leads")
    .delete()
    .lt("created_at", cutoff)
    .select("id");

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const deleted = (data || []).length;
  return new Response(
    JSON.stringify({
      deleted,
      retention_days: RETENTION_DAYS,
      cutoff,
      ran_at: new Date().toISOString(),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
