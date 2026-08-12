# MalumeScholarTrack - Secrets Management

## EAS Secrets Setup

Before deploying, configure secrets in EAS:

```bash
# Login to Expo
eas login

# Add secrets (replace with your actual values)
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://zjcribmwgavpzycgpwva.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"

# Or create a .env file and import from it
eas secret:create --scope environment --name EXPO_PUBLIC_SUPABASE_URL --value-file ./env.production
```

## GitHub Actions Secrets

Add these secrets in GitHub repo settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `EXPO_TOKEN` | Your Expo access token (run `eas token:generate`) |
| `EXPO_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |

## Supabase Credentials

Current credentials (ROTATE THESE):

- **URL**: `https://zjcribmwgavpzycgpwva.supabase.co`
- **Anon Key**: `REDACTED_SUPABASE_JWT_2`

### To rotate:
1. Go to Supabase Dashboard → Settings → API
2. Generate new anon key
3. Update EAS secrets and GitHub secrets
4. Update local `.env` for development
