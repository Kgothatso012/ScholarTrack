# ScholarTrack - New Developer Guide

## What is ScholarTrack?

ScholarTrack is a **student transport safety app** for South African schools. It connects parents, drivers, and schools to track children safely.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Expo/React Native (mobile app) |
| Backend-as-a-Service | Supabase (PostgreSQL + Auth + Realtime) |
| Navigation | React Navigation |
| State | React Context |

---

## Project Structure

```
ScholarTrack-Expo54/
├── src/
│ ├── screens/
│ │ ├── auth/          # Login, SignUp, ForgotPassword
│ │ ├── driver/        # DriverApp, Trip, Compliance, VehicleChecklist
│ │ ├── parent/        # ParentDashboard, TrackBus, Payments
│ │ ├── admin/         # AdminDashboard, UserManagement
│ │ ├── safety/        # TripHistory, EmergencySos
│ │ └── support/       # SupportScreen
│ ├── navigation/      # RootNavigator, AuthStack, DriverStack, ParentStack
│ ├── lib/             # API client, utils
│ │   └── services/    # Split services (auth, children, driver, trip)
│ ├── components/      # Reusable UI components
│ └── context/         # Theme, Auth providers
├── supabase/          # Schema files & migrations
└── android/           # Built APK outputs
```

---

## Key Features

### For Parents
- Track child's bus in real-time
- Hire verified drivers
- Get arrival alerts
- Emergency SOS button
- View payments and trip history

### For Drivers
- Trip management
- Vehicle safety checklists
- Compliance documents
- Trip manifest

### For Admins
- User management
- School administration
- Payment tracking

---

## Running the App

```bash
cd ~/ScholarTrack-Expo54

# Install dependencies
npm install --legacy-peer-deps

# Start Expo
npm start

# Run tests
npm test

# TypeScript check
npx tsc --noEmit
```

---

## Environment Variables

**Required** (create `.env` locally, DO NOT commit):
```
EXPO_PUBLIC_SUPABASE_URL=https://zjcribmwgavpzycgpwva.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_PAYSTACK_SECRET_KEY=your_paystack_key
```

---

## Git Workflow

```bash
# Before committing
npm test
npx tsc --noEmit

# Commit and push
git add -A && git commit -m "description" && git push origin master
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/api.ts` | Supabase client (re-exports from services/) |
| `src/lib/services/` | Split service modules |
| `src/navigation/RootNavigator.tsx` | Main navigation |
| `supabase-schema.sql` | Database schema |
| `PROJECT_MEMO.md` | Original requirements |

---

## Supabase

- **URL:** https://zjcribmwgavpzycgpwva.supabase.co
- **Auth:** Email/password via Supabase Auth
- **Tables:** profiles, drivers, children, schools, trips, payments, driver_assignments, driver_documents

---

## Testing

```bash
npm test                    # Run Jest tests
npx tsc --noEmit            # TypeScript check
```

---

## Common Issues

1. **Build errors** — Run `npx tsc --noEmit`
2. **Login fails** — Check Supabase auth settings
3. **Navigation broken** — Check RootNavigator.tsx
4. **Missing env vars** — App throws error on startup (intentional - fail fast)

---

## GSD Workflow for ScholarTrack

When working on ScholarTrack:

1. **GRAB** — Understand the task
2. **DO** — Implement → Test → Commit
3. **VERIFY** — Run `npx tsc --noEmit` before claiming done

---

## Agent Directives (for AI assistants)

See `CLAUDE.md` for production-grade overrides including:
- Forced verification (tsc check after every edit)
- Phased execution (max 5 files per phase)
- Senior dev standard (fix architecture, not just symptoms)