# Incident Response — Supabase anon-key data exposure

**Status:** Open (awaiting production containment)
**Date discovered:** 2026-07-16 (backend pentest) / 2026-07-24 (APK audit confirmed the exploit chain)
**Severity:** Critical
**Data classification:** Personal information of special-category data subjects (children)
**Regulatory frame:** POPIA (South Africa) — child personal information is afforded
heightened protection; notification obligations apply.

## 1. Summary
The ScholarTrack Android app ships the Supabase **anon key** in the client
bundle, and the production Supabase backend had Row Level Security disabled or
misconfigured on the core tables. The combination allowed anyone who downloaded
the public APK to read, update, and delete rows in `drivers`, `children`,
`trips`, `driver_tracking`, `vehicles` and `route_assignments` using only the
embedded anon key — no authentication required.

## 2. Scope of exposure
Confirmed via the public anon key (read-only verification, no data modified):

| Table | Fields exposed | Risk |
|-------|----------------|------|
| children | full_name, grade, pickup_address, school_id, parent_id | Child PII + physical safety |
| drivers | full_name, phone, vehicle plate, license_number, live GPS | Driver PII + live location |
| trips | student name, pickup, dropoff, schedule | Travel pattern of minors |
| vehicles | registration, VIN, expiry dates | Fleet/identity theft |
| route_assignments | child↔driver↔route mapping | Targeting |

**Impact:** Unauthenticated, unattributable access to minors' home addresses,
schools, and live transport routes — a direct physical-safety risk to children,
not merely a data-loss event.

**Unknowns:** How long RLS was open in production; whether the anon key was
actively abused (Supabase request logs must be reviewed for the open window).

## 3. Evidence
- `pentest-agent/targets/scholartrack-app/REPORT.md` (2026-07-16) — anon-key
  `GET/PATCH/DELETE` on `/rest/v1/drivers|children|trips` returned real PII.
- `pentest-agent/targets/scholartrack-app/REPORT.md` (2026-07-24 addendum) —
  APKv2 signing cert `CN=Android Debug` and the anon key extracted from
  `assets/index.android.bundle` via `strings`.

## 4. Containment (priority order)
1. **Apply `supabase/migrations/014_rls_lockdown.sql` to production**
   (`supabase db push`). This enables `FORCE ROW LEVEL SECURITY` and ownership-
   gated policies, blocking the anon key from all core tables. **This is the
   single action that stops the active exposure.**
2. **Rotate the anon key** (Supabase Dashboard → Settings → API → generate new
   anon key). The old key is permanently public in shipped APKs and must be
   treated as compromised even after RLS is fixed.
3. Update the rotated key in `.env`, GitHub Actions secrets, and EAS secrets.

## 5. Eradication
- Ship only the new release build (signed with the upload keystore, not the
  Android debug key) — see `docs/RELEASE.md`.
- Retire all debug-signed APKs currently in circulation.
- Restrict + rotate the Google Maps API key (GCP Console → application + API
  restrictions for `com.scholartrack.sa`).
- Move role assignment server-side; stop trusting client `user_metadata.role`
  (the RLS migration's `profiles` CHECK enforces `role IN ('parent','driver')`).

## 6. Notification considerations (POPIA)
- Children's personal information is special-category data under POPIA. A
  reasonable data subject (parents/guardians) is entitled to be notified of a
  compromise that is likely to affect them.
- Determine the exposure window from Supabase logs; if the open window was
  non-trivial, prepare a notification to affected parents/guardians describing
  what was exposed (child name, grade, home/school address, transport route),
  the risk, and the remediation.
- Do **not** include the technical exploit details in the user-facing notice.
- Log the incident with the Information Regulator if the threshold for
  notification is met (consult POPIA s22 / the Information Regulator's guidance
  on security compromises).

## 7. Recovery / verification
- After `db push`, re-run the read/write verification against the **new** anon
  key; confirm `GET /rest/v1/children?select=*` returns `401/empty` for anon.
- Confirm `apksigner verify --print-certs` on the new release AAB is **not**
  `CN=Android Debug`.
- Add a regression test that asserts RLS blocks anon on core tables
  (`__tests__/rls.test.ts` exists — extend it to cover the 014 policies).

## 8. Timeline (fill in)
- [ ] Production `supabase db push` applied (014)
- [ ] Anon key rotated
- [ ] Exposure window determined from logs
- [ ] User notification decision made (and sent, if required)
- [ ] New signed release shipped; debug APKs retired
- [ ] Maps key restricted/rotated
