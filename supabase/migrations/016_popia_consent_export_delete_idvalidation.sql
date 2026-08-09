-- ============================================================================
-- Migration 016: POPIA consent, data export/delete RPCs, server-side ID validation
-- ----------------------------------------------------------------------------
-- Closes the production-track POPIA gaps from the combined review:
--   §6.2  consent_version/consent_at + signup consent record
--   §6.3  export_user_data(uid) — POPIA §23 right of access
--   §6.4  delete_user_cascade(uid) + server-side audit row — POPIA §24 erasure
--   §6.7  server-side RSA-ID validation that rejects bad IDs at insert (so a
--         crafted client or the leaked anon key cannot insert any 13-digit
--         string into drivers.id_number)
--
-- All RPCs are SECURITY DEFINER so they bypass RLS for the cascade/export work
-- but re-check ownership (auth.uid() = p_uid, or admin) themselves.
-- ============================================================================

-- ===========================================================================
-- 1. Consent columns + consent audit table
-- ===========================================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_version TEXT NOT NULL,
  policy_url TEXT,
  consent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own consents" ON user_consents;
CREATE POLICY "Users can read own consents"
  ON user_consents FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can record own consent" ON user_consents;
CREATE POLICY "Users can record own consent"
  ON user_consents FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can read all consents" ON user_consents;
CREATE POLICY "Admins can read all consents"
  ON user_consents FOR SELECT USING (public.current_user_role() = 'admin');
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);

-- ===========================================================================
-- 2. Deleted-account audit table (kept after the user's data is purged)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.deleted_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT,
  email TEXT,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_accounts FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read deleted accounts" ON deleted_accounts;
CREATE POLICY "Admins can read deleted accounts"
  ON deleted_accounts FOR SELECT USING (public.current_user_role() = 'admin');

-- ===========================================================================
-- 3. record_consent(p_version) — persist a user's consent to the current
--    policy version (called by the app after signup / on re-prompt).
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.record_consent(p_version TEXT, p_policy_url TEXT DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO user_consents(user_id, consent_version, policy_url)
  VALUES (auth.uid(), p_version, p_policy_url);
  UPDATE profiles
    SET consent_version = p_version, consent_at = now(), updated_at = now()
    WHERE id = auth.uid();
END $$;

-- ===========================================================================
-- 4. export_user_data(p_uid) — POPIA §23 right of access. Returns the user's
--    own data as a single JSON object. Defaults to the caller's uid.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.export_user_data(p_uid UUID DEFAULT auth.uid())
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  p_uid := COALESCE(p_uid, auth.uid());
  IF p_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_uid <> auth.uid() AND public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Not authorized to export this user''s data';
  END IF;
  RETURN jsonb_build_object(
    'user_id', p_uid,
    'exported_at', now(),
    'profile', COALESCE((SELECT to_jsonb(p) FROM profiles p WHERE p.id = p_uid), 'null'::jsonb),
    'children', COALESCE((
      SELECT jsonb_agg(to_jsonb(c)) FROM children c WHERE c.parent_id = p_uid
    ), '[]'::jsonb),
    'trips', COALESCE((
      SELECT jsonb_agg(to_jsonb(t)) FROM trips t
      WHERE t.driver_id IN (SELECT id FROM drivers WHERE user_id = p_uid)
         OR t.child_id IN (SELECT id FROM children WHERE parent_id = p_uid)
    ), '[]'::jsonb),
    'emergency_contacts', COALESCE((
      SELECT jsonb_agg(to_jsonb(e)) FROM emergency_contacts e WHERE e.user_id = p_uid
    ), '[]'::jsonb),
    'payments', COALESCE((
      SELECT jsonb_agg(to_jsonb(pay)) FROM payments pay
      WHERE pay.parent_id = p_uid
         OR pay.driver_id IN (SELECT id FROM drivers WHERE user_id = p_uid)
    ), '[]'::jsonb),
    'driver_tracking', COALESCE((
      SELECT jsonb_agg(to_jsonb(dt)) FROM driver_tracking dt
      WHERE dt.driver_id IN (SELECT id FROM drivers WHERE user_id = p_uid)
    ), '[]'::jsonb),
    'consents', COALESCE((
      SELECT jsonb_agg(to_jsonb(uc)) FROM user_consents uc WHERE uc.user_id = p_uid
    ), '[]'::jsonb)
  );
END $$;

-- ===========================================================================
-- 5. delete_user_cascade(p_uid) — POPIA §24 erasure. Purges all of a user's
--    data, keeps a deleted_accounts audit row, and is callable by the user
--    for their own account (or an admin). The auth.users row itself is removed
--    by the service-role delete-user edge-function step; the data is purged
--    here so even a leaked anon key can no longer read it.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.delete_user_cascade(p_uid UUID DEFAULT auth.uid())
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  p_uid := COALESCE(p_uid, auth.uid());
  IF p_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_uid <> auth.uid() AND public.current_user_role() <> 'admin' THEN
    RAISE EXCEPTION 'Not authorized to delete this account';
  END IF;

  -- Audit row (kept) BEFORE purging.
  INSERT INTO deleted_accounts(user_id, role, email, deleted_at)
  SELECT id, role, email, now() FROM profiles WHERE id = p_uid
  ON CONFLICT (user_id) DO UPDATE SET deleted_at = now();

  DELETE FROM driver_tracking
    WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = p_uid);
  DELETE FROM payments
    WHERE parent_id = p_uid
       OR driver_id IN (SELECT id FROM drivers WHERE user_id = p_uid);
  DELETE FROM geofence_alerts
    WHERE child_id IN (SELECT id FROM children WHERE parent_id = p_uid)
       OR driver_id IN (SELECT id FROM drivers WHERE user_id = p_uid);
  DELETE FROM trips
    WHERE driver_id IN (SELECT id FROM drivers WHERE user_id = p_uid)
       OR child_id IN (SELECT id FROM children WHERE parent_id = p_uid);
  DELETE FROM emergency_contacts WHERE user_id = p_uid;
  DELETE FROM children WHERE parent_id = p_uid;
  DELETE FROM drivers WHERE user_id = p_uid;
  DELETE FROM user_consents WHERE user_id = p_uid;
  DELETE FROM profiles WHERE id = p_uid;
END $$;

-- ===========================================================================
-- 6. Server-side RSA ID validation (full Luhn checksum + date) + a trigger
--    that rejects invalid IDs at insert/update on drivers.id_number. This
--    replaces client-only validation (ComplianceUploadScreen.tsx) so a
--    crafted client or the leaked anon key cannot insert any 13-digit string.
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.validate_rsa_id(id_text TEXT)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  s TEXT := regexp_replace(COALESCE(id_text, ''), '[^0-9]', '', 'g');
  y INT; m INT; d INT; i INT; total INT := 0; dbl INT; digit INT; dist INT;
BEGIN
  IF length(s) <> 13 OR s !~ '^[0-9]{13}$' THEN RETURN false; END IF;
  y := substring(s, 1, 2)::int;
  m := substring(s, 3, 2)::int;
  d := substring(s, 5, 2)::int;
  IF m < 1 OR m > 12 OR d < 1 OR d > 31 THEN RETURN false; END IF;
  -- Luhn: from the rightmost (check) digit, double every second digit.
  FOR i IN 1..13 LOOP
    digit := substring(s, i, 1)::int;
    dist := 13 - i;            -- distance from the right
    IF dist % 2 = 1 THEN       -- double every second digit from the right
      dbl := digit * 2;
      IF dbl > 9 THEN dbl := dbl - 9; END IF;
      total := total + dbl;
    ELSE
      total := total + digit;
    END IF;
  END LOOP;
  RETURN total % 10 = 0;
END $$;

CREATE OR REPLACE FUNCTION public.check_driver_id_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.id_number IS NOT NULL AND public.validate_rsa_id(NEW.id_number) = false THEN
    RAISE EXCEPTION 'Invalid RSA ID number (failed checksum/date): %', NEW.id_number
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_driver_id_number ON drivers;
CREATE TRIGGER trg_driver_id_number
  BEFORE INSERT OR UPDATE OF id_number ON drivers
  FOR EACH ROW EXECUTE FUNCTION public.check_driver_id_number();

SELECT 'Migration 016: POPIA consent + export/delete RPCs + server-side ID validation applied' AS result;
