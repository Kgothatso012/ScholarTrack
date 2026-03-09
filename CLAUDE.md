# CLAUDE.md - ScholarTrack

**Purpose:** Student transport safety app connecting parents, drivers, and schools. Real-time bus tracking, driver verification, trip manifests, compliance documents, and payment tracking.

**Tech Stack:** Expo/React Native (frontend), Node.js/Express (backend), Supabase (database & auth), Expo Router (navigation)

---

## Repo Map

```
ScholarTrack-Expo54/
├── src/
│   ├── screens/
│   │   ├── auth/          # Login, Signup, ForgotPassword
│   │   ├── driver/        # DriverApp, Trip, Compliance, VehicleChecklist
│   │   ├── parent/        # ParentDashboard, TrackBus, Payments
│   │   ├── admin/         # AdminDashboard, UserManagement
│   │   ├── safety/        # TripHistory, EmergencySos
│   │   └── support/       # SupportScreen
│   ├── navigation/        # RootNavigator, AuthStack, DriverStack, ParentStack
│   ├── lib/               # api.ts (Supabase client), utils.ts
│   └── components/        # Reusable UI components
├── backend/
│   └── src/
│       ├── routes/        # API endpoints
│       ├── config/        # Database migrations
│       └── index.ts       # Express server
├── supabase/              # Schema files
└── __tests__/             # Jest tests
```

---

## Rules

### Must Do
- Run `npm test` before committing
- Use environment variables for API keys (never commit secrets)
- Add accessibility labels to all interactive elements
- Follow existing code patterns in each module

### Never Do
- Don't commit `.env` or `secrets.json`
- Don't push directly to main (always commit first)
- Don't skip tests on core features

---

## Commands

```bash
# Development
cd /home/kgothatso012/ScholarTrack-Expo54
npm start                    # Start Expo
npm run android              # Build Android
npm test                     # Run tests
npx tsc --noEmit             # TypeScript check

# Backend
cd backend
npm start                    # Start Express server
npx knex migrate:latest       # Run migrations

# Git
git add -A && git commit -m "description"
git push origin master
```

---

## Key Context

- **Supabase:** https://zjcribmwgavpzycgpwva.supabase.co
- **Driver test:** Use credentials from PROJECT_MEMO.md
- **Recent fix:** Navigation screens added to DriverStack (commit 01c8ae2)
- **Backend TS:** Fixed types in migrations (commit 41c738a)
