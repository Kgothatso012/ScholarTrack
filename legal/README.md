# Legal documents & deployment notes

`PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md` are the POPIA-aware policy and
terms shown to users (consent checkbox at signup + the `ConsentGate`
re-prompt). Both are **Version 1.0**, matching `CONSENT_VERSION` in
`src/constants/app.ts`. Bump the version there and in these documents together,
then re-prompt users.

## Before you publish — fill the placeholders

Search for `[` in both files and replace with real values:

- `[Legal entity name]`, `[street, suburb, city, RSA]` physical address
- `[IO name]`, `io@malumescholartrack.co.za`, `[+27 …]` / `[phone]` for the
  Information Officer
- Confirm the Information Officer is **registered with the Information
  Regulator** (inforegulator.org.za) and that the body is registered as a
  responsible party.

## Host these at the URLs the App already uses

The App links to (and the consent flow opens):

- `https://malumescholartrack.co.za/privacy` ← render `PRIVACY_POLICY.md`
- `https://malumescholartrack.co.za/terms`   ← render `TERMS_OF_SERVICE.md`

Keep those exact URLs — `SettingsScreen.tsx` and `RegisterScreen.tsx` and
`ConsentGate.tsx` all point at them.

## Deploy the `delete-user` edge function

Full account erasure needs the service-role edge function (the client RPC
`delete_user_cascade` purges data but cannot remove the `auth.users` row).

```
supabase functions deploy delete-user
supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_ANON_KEY=...
```

`SUPABASE_ANON_KEY` is used only to resolve the caller's identity from their
JWT (the destructive work runs with the service role). The App calls it via
`supabase.functions.invoke('delete-user')` from **Settings → Delete my
account**.

## Migrations still to apply

Before any trial with real children, apply on the Supabase project:

- `supabase/migrations/015_geofence_rls_lockdown.sql`
- `supabase/migrations/016_popia_consent_export_delete_idvalidation.sql`

Run `supabase db push` or apply them in the dashboard.
