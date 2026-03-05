# ScholarTrack SA - Project Memory

## What We Built

A complete **student transport safety app** for South Africa, inspired by inDrive with purple/black theme.

## Tech Stack
- **Framework:** Expo (React Native)
- **Backend:** Supabase (connected)
- **Navigation:** Custom drawer menu + bottom tabs removed (inDrive style)
- **Theme:** Black primary, yellow accent (#FFB81C)

## Features Built

### 1. All User Roles
- Parent App
- Driver App  
- Admin Dashboard (basic)
- Developer Tools

### 2. Safety Features (Phase 1)
- Panic Button (SOS)
- Live Location Tracking
- Emergency Contacts
- Safe Word System
- Geofencing

### 3. Trust Features (Phase 2)
- Driver Verification Badges
- Incident Reporting
- Trip History

### 4. Payments (Phase 3)
- Credit Card, Zapper, SnapScan, Instant EFT
- Payment History & Receipts

### 5. Settings & Scale (Phase 4)
- Multi-language (8 SA languages)
- Dark Mode toggle
- Admin Dashboard

### 6. Latest Additions
- Driver App (trips, earnings, payments)
- My Children (multiple kids)
- Emergency Services (quick dial)
- Support (chat, call, WhatsApp)
- Safety Tips

### 7. Fleet & Vehicle Management (Latest)
- Fleet Tracking Dashboard (real-time driver GPS)
- Vehicle Management (registration, document expiry tracking)
- Parent-Driver Chat (in-app messaging)
- Student Attendance & Reports (daily/weekly/monthly)
- Geofencing & Alerts
- Route Management

## App Structure
- Hamburger menu (inDrive floating style)
- Dark/Light theme
- Screens in menu:
  - Home, Driver App, My Children, Live Tracking, Emergency, Trip History, Hire Driver, Reviews, Payments, Reports, Settings, Support, Safety Tips, Dark Mode

## Files Location
- Main app: `~/ScholarTrack-Expo54/App.tsx`
- Screens: `~/ScholarTrack-Expo54/src/screens/`
- Backend: `~/ScholarTrack-Expo54/backend/`

## GitHub
- Repository: `https://github.com/kgothatso012/ScholarTrack-Expo54`
- SSH key added but push failed (needs GitHub config)

## Supabase
- URL: https://zjcribmwgavpzycgpwva.supabase.co
- Connected and working

## Login Credentials (Demo)
- parent@test.com → Parent
- driver@test.com → Driver
- admin@test.com → Admin
- dev@test.com → Developer
- Password: any

## What's Missing for Production
1. Real push notifications
2. Actual payment integration
3. App Store deployment
4. Driver app login flow
5. Parent-child linking

## Next Steps (if chat resets)
1. Read this file
2. `cd ~/ScholarTrack-Expo54`
3. `npx expo start --web`
4. Continue building!

---
Last updated: 2026-03-05
