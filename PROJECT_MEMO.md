# MalumeScholarTrack SA - Project Memory

## What We Built

A complete **student transport safety app** for South Africa, connecting parents, drivers, and schools.

---

## Tech Stack
- **Framework:** Expo SDK 54 (React Native)
- **Backend:** Node.js/Express + Supabase (PostgreSQL + Auth + Realtime)
- **Navigation:** React Navigation (Drawer + Bottom Tab + Stack)
- **Maps:** OSM (OpenStreetMap) via WebView — works on Huawei/non-Google phones
- **Payments:** Paystack (partially wired — see Production Gaps below)
- **Theme:** Dark glassmorphism design system

---

## Key Files
- `App.tsx` — entry point
- `src/lib/supabase.ts` — Supabase client
- `src/navigation/RootNavigator.tsx` — role-based routing
- `supabase/` — schema + edge functions
- `backend/` — Express API routes
- `DESIGN_AUDIT_V2.md` — design system audit (2026-04-15)

---

## App Structure

| Role | Screens |
|------|---------|
| Parent | Dashboard, My Children, LiveTrack, HireDriver, Payments, Emergency, TripHistory |
| Driver | DriverApp, TripScreen, EarningsScreen, ComplianceDashboard |
| Admin | FleetTracking, ManageDrivers, ManageSchools, AdminPayments |
| Safety | LiveTrackScreen, TripHistoryScreen, EmergencySosScreen |

---

## What's Implemented ✅
- Email/password auth (Supabase) with role-based routing
- Driver role detection on login (prefers user_metadata over profiles table)
- Driver login flow → DriverStack
- Parent-child linking (direct insert to children table with parent_id)
- Live GPS tracking (expo-location + Supabase Realtime)
- Supabase Realtime subscription for location updates (TrackChildScreen, LiveTrackScreen)
- FleetTrackingScreen with OSM WebView map
- Geofencing (GeofenceService + triggerGeofenceAlert)
- Push notification pipeline (service + edge function exist)
- Paystack payment modal (wired to PaymentDetailsScreen)
- Dark glassmorphism design system (theme tokens, no hardcoded colors)
- EmptyState component (in ui-plugin, not yet used in all screens)
- LayoutAnimation on state changes (partially applied)

---

## Production Gaps

| Gap | Severity | Fix Needed |
|-----|----------|-----------|
| `EXPO_ACCESS_TOKEN` not set in Supabase secrets | 🔴 Critical | Run: `supabase secrets set EXPO_ACCESS_TOKEN=<from expo.dev>` |
| Paystack webhook handler not deployed | 🔴 Critical | Deploy `supabase/functions/send-notification` + add Paystack webhook in dashboard |
| `EXPO_PUBLIC_PAYSTACK_SECRET_KEY` not set | 🔴 Critical | Add to Supabase secrets + `.env` |
| EmptyState component not used in 13+ screens | 🟡 Medium | Wire `EmptyState` component to list screens |
| LayoutAnimation missing on some state changes | 🟡 Medium | Add to remaining `setState` calls |
| PROJECT_MEMO outdated | 🟡 Medium | Updated 2026-05-02 |

---

## Push Notifications Setup

1. Get token: https://expo.dev/access-tokens
2. Set secret:
   ```
   supabase secrets set EXPO_ACCESS_TOKEN=<your_token>
   ```
3. Edge function already exists at `supabase/functions/send-notification/`

---

## Login Credentials (Demo)
- `parent@test.com` → Parent
- `driver@test.com` → Driver
- `admin@test.com` → Admin
- Password: `testpassword123`

---

## GitHub
- Repository: `https://github.com/kgothatso012/MalumeScholarTrack-Expo54`

---

## Build & Run

```bash
cd ~/MalumeScholarTrack-Expo54
npm install --legacy-peer-deps
npx expo start
npx tsc --noEmit   # type check
```

---

Last updated: 2026-05-02
Status: NEARLY PRODUCTION READY — 2 critical secrets gaps remain
