# 🚌 MalumeScholarTrack - Complete Testing Guide

## App Overview
MalumeScholarTrack is a student transport management app connecting parents, drivers, and administrators.

## Demo Accounts (Test Now)
| Role | Email | Password |
|------|-------|----------|
| Parent | parent@test.com | any |
| Driver | driver@test.com | any |
| Admin | admin@test.com | any |

---

## 🧪 TESTING CHECKLIST

### 1. AUTHENTICATION
- [ ] Login - Enter demo credentials
- [ ] Register - Click Sign Up, fill form
- [ ] Logout - From settings

### 2. PARENT FUNCTIONALITY
- [ ] Dashboard stats
- [ ] Children Management (add/edit/delete)
- [ ] Hire Driver
- [ ] Live Tracking (map)
- [ ] Emergency/Panic button
- [ ] Payments

### 3. DRIVER FUNCTIONALITY
- [ ] Dashboard & schedule
- [ ] Trip Management
- [ ] Compliance Documents Upload
- [ ] Vehicle Safety Checklist
- [ ] Earnings

### 4. ADMIN FUNCTIONALITY
- [ ] Dashboard analytics
- [ ] Driver management
- [ ] Reports

### 5. UI/THEME
- [ ] Black/Gold theme consistent
- [ ] Navigation works
- [ ] Dark mode applied

---

## 🔧 CURRENT STATUS

| Feature | Status |
|---------|--------|
| Login/Register | ✅ Working |
| Parent Dashboard | ✅ Working |
| Driver Dashboard | ✅ Working |
| Document Upload | 🔶 Web Limited |
| Supabase Auth | 🔶 Demo |
| Real-time Tracking | ❌ Not implemented |
| Push Notifications | ❌ Not implemented |

---

## 🚀 PRODUCTION STEPS

1. Fix EAS build issues
2. Connect real Supabase
3. Add email verification
4. Add payment gateway
5. Build APK/IPA
6. Submit to stores

## Live Test Workers (Seeded)

Run with a server-side Supabase key (never the Expo anon key):

```bash
SUPABASE_SERVICE_ROLE_KEY=<service_role_key> npm run seed:test-workers
```

| Role | Email |
|------|-------|
| Parent | `john.moyo@test.local` |
| Driver | `thabo.mkhize@test.local` |
| RLS parent A | `rls-parent-a@test.local` |
| RLS parent B | `rls-parent-b@test.local` |
| RLS driver A | `rls-driver-a@test.local` |

Default password: `Malume-Tester-2026!` (override with `TEST_WORKER_PASSWORD`).
Seed creates profiles, Thabo's verified Quantum, John's children, and one active Amahle→Thabo assignment.

## Real Map Fallback

`Home > Track` uses the existing OpenStreetMap WebView. If the device is offline or map tiles fail to load, the map is replaced by an elder-friendly retry screen. Status and driver details continue loading independently.
