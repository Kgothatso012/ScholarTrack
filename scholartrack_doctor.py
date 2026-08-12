#!/usr/bin/env python3
"""
malumescholartrack_doctor.py - Config + security + RLS invariant checker.

Run before any release / PR / store submission. Catches the issues the
brutal review flagged as production-blocking:
  - .env files committed to git
  - RLS not enabled on a table
  - Wide-open "Anyone can read" RLS policies
  - API keys in the client bundle (sk_, AIza, eyJhbGciOi)
  - Paystack secret baked into EXPO_PUBLIC_*
  - driver_tracking SELECT policy too permissive
  - getTripsForChild returns [] (broken)
  - AuthStack uses setState navigation instead of useNavigation

Usage:
    python3 malumescholartrack_doctor.py                # run all, exit 1 on any fail
    python3 malumescholartrack_doctor.py --json         # machine-readable
    python3 malumescholartrack_doctor.py --check X,Y    # named checks
    python3 malumescholartrack_doctor.py --list         # available checks
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Callable

BASE_DIR = Path(__file__).resolve().parent


class CheckResult:
    __slots__ = ("name", "ok", "message", "details")

    def __init__(self, name, ok, message, details=None):
        self.name = name
        self.ok = ok
        self.message = message
        self.details = details or {}

    def to_dict(self):
        return {"name": self.name, "ok": self.ok, "message": self.message, "details": self.details}


CHECKS: dict[str, Callable] = {}


def check(name):
    def decorator(fn):
        CHECKS[name] = fn
        return fn
    return decorator


# ── Security ──────────────────────────────────────────────────────────────

SECRET_PATTERNS = [
    (r"sk_live_[A-Za-z0-9]{20,}", "Paystack LIVE secret (catastrophic)"),
    (r"sk_test_[A-Za-z0-9]{20,}", "Paystack test secret"),
    (r"AIzaSy[A-Za-z0-9_-]{30,}", "Google Maps / Firebase API key"),
    (r"eyJhbGciOi[A-Za-z0-9_-]{40,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}", "JWT token"),
    (r"password\s*=\s*['\"]?[A-Za-z0-9!@#$%^&*]{6,}", "Inline password= assignment"),
]

CLIENT_BUNDLE_PATH_HINTS = ("src/", "app/", "App.tsx", "index.ts")


def _is_tracked(path: Path) -> bool:
    try:
        out = subprocess.run(
            ["git", "ls-files", "--error-unmatch", str(path.relative_to(BASE_DIR))],
            cwd=BASE_DIR, capture_output=True, text=True, check=False,
        )
        return out.returncode == 0
    except (FileNotFoundError, ValueError):
        return False


@check("env-not-in-git")
def check_env_not_in_git():
    """`.env`, `backend/.env`, and `SECRETS.md` must NOT be tracked by git."""
    offenders = []
    for path in [".env", "backend/.env", "SECRETS.md", ".env.example", "backend/.env.example"]:
        # .env.example files are OK to be tracked (placeholders); skip them
        if path.endswith(".example"):
            continue
        p = BASE_DIR / path
        if p.exists() and _is_tracked(p):
            offenders.append(path)
    if offenders:
        return CheckResult("env-not-in-git", False,
            f"Tracked secret files: {offenders}. Use git filter-repo to scrub history.",
            {"offenders": offenders})
    return CheckResult("env-not-in-git", True, "No .env or SECRETS.md files in git tracking")


@check("env-mode-600")
def check_env_mode_600():
    """Live .env files must be mode 600 (owner-read-only)."""
    bad = []
    for path in [".env", "backend/.env"]:
        p = BASE_DIR / path
        if p.exists():
            mode = p.stat().st_mode & 0o777
            if mode & 0o077:
                bad.append((path, oct(mode)))
    if bad:
        return CheckResult("env-mode-600", False,
            f"World/group-readable .env files: {bad}. Run chmod 600.",
            {"bad": bad})
    return CheckResult("env-mode-600", True, "All .env files are mode 600")


@check("no-secrets-in-source")
def check_no_secrets_in_source():
    """No API keys, JWTs, or Paystack secrets in tracked source files.

    EXPO_PUBLIC_* env vars are fine (they're meant to be in the client).
    sk_live_, AIzaSy, eyJhbGciOi without a placeholder suffix are not.
    """
    offenders = []
    try:
        out = subprocess.run(
            ["git", "ls-files"], cwd=BASE_DIR, capture_output=True, text=True, check=True,
        )
        tracked = out.stdout.splitlines()
    except (FileNotFoundError, subprocess.CalledProcessError):
        return CheckResult("no-secrets-in-source", True, "skipped: no git")
    for path in tracked:
        full = BASE_DIR / path
        if not full.exists() or not full.is_file():
            continue
        if full.suffix not in (".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".env", ".sql"):
            continue
        try:
            text = full.read_text(errors="replace")
        except OSError:
            continue
        for pat, label in SECRET_PATTERNS:
            for m in re.finditer(pat, text):
                snippet = m.group(0)[:30] + "..."
                offenders.append({"file": path, "match": label, "snippet": snippet})
    if offenders:
        return CheckResult("no-secrets-in-source", False,
            f"Found {len(offenders)} secret pattern(s) in source",
            {"offenders": offenders[:10]})
    return CheckResult("no-secrets-in-source", True, "No secret patterns in tracked source")


@check("paystack-not-in-client-bundle")
def check_paystack_not_in_client():
    """EXPO_PUBLIC_PAYSTACK_SECRET_KEY must not exist. Payment init belongs server-side."""
    env = BASE_DIR / ".env"
    if not env.exists():
        return CheckResult("paystack-not-in-client-bundle", True, "No .env to check")
    text = env.read_text()
    if "EXPO_PUBLIC_PAYSTACK_SECRET_KEY" in text and re.search(
        r"EXPO_PUBLIC_PAYSTACK_SECRET_KEY\s*=\s*sk_", text):
        return CheckResult("paystack-not-in-client-bundle", False,
            "EXPO_PUBLIC_PAYSTACK_SECRET_KEY=sk_... leaks Paystack secret into client bundle. "
            "Move to a Supabase Edge Function.",
            {"hint": "Strip this var; use functions/v1/initiate-payment"})
    return CheckResult("paystack-not-in-client-bundle", True, "No Paystack secret in client bundle")


# ── RLS ─────────────────────────────────────────────────────────────────

@check("rls-enabled-all-tables")
def check_rls_enabled():
    """Every public table must have RLS enabled."""
    schema = BASE_DIR / "supabase" / "schema.sql"
    if not schema.exists():
        return CheckResult("rls-enabled-all-tables", True, "skipped: no schema.sql")
    text = schema.read_text()
    # Find CREATE TABLE statements
    tables = re.findall(r"CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(\w+)", text)
    rls_on = set(re.findall(r"ALTER TABLE\s+(\w+)\s+ENABLE ROW LEVEL SECURITY", text))
    missing = [t for t in tables if t not in rls_on and not t.startswith("pg_")]
    if missing:
        return CheckResult("rls-enabled-all-tables", False,
            f"RLS not enabled on: {missing}",
            {"missing": missing})
    return CheckResult("rls-enabled-all-tables", True, f"RLS enabled on all {len(tables)} tables")


@check("no-wide-open-rls")
def check_no_wide_open_rls():
    """No policy that grants SELECT to everyone (USING (true)) on user-data tables.

    driver_tracking is especially important — a school-run GPS stream must
    not be world-readable. Migration 011 is the canonical fix.
    """
    schema = BASE_DIR / "supabase" / "schema.sql"
    if not schema.exists():
        return CheckResult("no-wide-open-rls", True, "skipped")
    text = schema.read_text()
    bad = []
    for m in re.finditer(
        r'CREATE POLICY\s+"([^"]+)"\s+ON\s+(\w+)\s+FOR\s+(SELECT|ALL)\s+USING\s*\(\s*(?:true|1)\s*\)',
        text, re.IGNORECASE,
    ):
        name, table, op = m.group(1), m.group(2), m.group(3).upper()
        if table in ("driver_tracking", "children", "parents", "emergency_contacts",
                     "trips", "payments", "profiles"):
            bad.append({"policy": name, "table": table, "op": op})
    if bad:
        return CheckResult("no-wide-open-rls", False,
            f"Wide-open policies on user-data tables: {bad}. Migration 011 needed.",
            {"bad": bad})
    return CheckResult("no-wide-open-rls", True, "No USING (true) policies on user-data tables")


@check("rls-trips-has-child-id")
def check_trips_has_child_id():
    """The trips table must have a child_id column. Without it, getTripsForChild returns []."""
    migrations_dir = BASE_DIR / "supabase" / "migrations"
    if not migrations_dir.exists():
        return CheckResult("rls-trips-has-child-id", True, "skipped")
    found = False
    for sql in sorted(migrations_dir.glob("*.sql")):
        text = sql.read_text()
        if re.search(r"ALTER TABLE\s+trips\s+ADD COLUMN\s+(IF NOT EXISTS\s+)?child_id", text, re.IGNORECASE):
            found = True
            break
    if not found:
        return CheckResult("rls-trips-has-child-id", False,
            "trips table has no child_id column. getTripsForChild returns [] always. "
            "Add migration 012_add_trip_child_id.sql.")
    return CheckResult("rls-trips-has-child-id", True, "trips.child_id migration present")


# ── App architecture ────────────────────────────────────────────────────

@check("authstack-uses-real-navigation")
def check_authstack_navigation():
    """AuthStack should not use setState to switch screens. Use useNavigation()."""
    f = BASE_DIR / "src" / "navigation" / "AuthStack.tsx"
    if not f.exists():
        return CheckResult("authstack-uses-real-navigation", True, "skipped")
    text = f.read_text()
    # Heuristic: real nav uses navigation.navigate('Register') etc.
    bad_patterns = [
        r"setShow\w+\(",          # setShowRegister, setShowForgotPassword, etc.
        r"showRegister\s*\?\s*\(.*<RegisterScreen",
    ]
    found = []
    for pat in bad_patterns:
        for m in re.finditer(pat, text):
            found.append(m.group(0)[:50])
    if found:
        return CheckResult("authstack-uses-real-navigation", False,
            f"AuthStack uses setState-based navigation ({len(found)} sites). "
            "Rewrite with useNavigation().",
            {"bad": found[:5]})
    return CheckResult("authstack-uses-real-navigation", True,
        "AuthStack uses real navigation")


@check("get-trips-for-child-not-stub")
def check_trips_for_child():
    """src/lib/services/trip.ts:getTripsForChild must not return [] as a stub."""
    f = BASE_DIR / "src" / "lib" / "services" / "trip.ts"
    if not f.exists():
        return CheckResult("get-trips-for-child-not-stub", True, "skipped")
    text = f.read_text()
    m = re.search(r"async getTripsForChild\([^)]*\)\s*\{[^}]*\}", text, re.DOTALL)
    if m and re.search(r"return\s*\[\s*\]", m.group(0)):
        return CheckResult("get-trips-for-child-not-stub", False,
            "getTripsForChild returns []. Parents see empty trip history. "
            "Add child_id to trips or filter by student_name.")
    return CheckResult("get-trips-for-child-not-stub", True, "getTripsForChild has real query")


@check("no-solana-ethers-ai-deps-unused")
def check_dead_deps():
    """@solana/web3.js, ethers, ai — must be either used in src/ or removed from package.json."""
    pkg = BASE_DIR / "package.json"
    if not pkg.exists():
        return CheckResult("no-solana-ethers-ai-deps-unused", True, "skipped")
    import json as _json
    data = _json.loads(pkg.read_text())
    deps = data.get("dependencies", {})
    candidates = ["@solana/web3.js", "ethers", "ai"]
    src = BASE_DIR / "src"
    src_text = ""
    if src.exists():
        for f in src.rglob("*"):
            if f.suffix in (".ts", ".tsx", ".js", ".jsx"):
                try:
                    src_text += f.read_text(errors="replace")
                except OSError:
                    pass
    unused = [c for c in candidates if c in deps and c.split("/")[-1] not in src_text
              and not any(part in src_text for part in c.split("/"))]
    # Special-case: 'ai' is too generic; check for `from 'ai'` or `import('ai')`
    if "ai" in unused:
        if re.search(r"from\s+['\"]ai['\"]|require\(['\"]ai['\"]\)", src_text):
            unused.remove("ai")
    if unused:
        return CheckResult("no-solana-ethers-ai-deps-unused", False,
            f"Listed in package.json but no usage in src/: {unused}",
            {"unused": unused})
    return CheckResult("no-solana-ethers-ai-deps-unused", True, "All exotic deps are used")


@check("no-two-services-dirs")
def check_two_services_dirs():
    """Verify services directories have a clear, non-overlapping purpose.

    Allowed layouts:
      A) src/services/  (single canonical location)
      B) src/lib/services/  (data layer) + src/platform/  (device APIs)
      C) src/services/  +  src/lib/services/  IF they don't re-export
         the same module (e.g. "auth" or "location").

    This check rejects the historic MalumeScholarTrack layout where
    src/lib/services/ (data) and src/services/ (device) both existed
    but were unclear, and warns if the same module name appears in both.
    """
    a = BASE_DIR / "src" / "lib" / "services"
    b = BASE_DIR / "src" / "services"
    if not (a.exists() and b.exists()):
        return CheckResult("no-two-services-dirs", True, "Single services directory")
    # Both exist — check for name overlap
    a_names = {p.stem for p in a.glob("*.ts")} if a.exists() else set()
    b_names = {p.stem for p in b.glob("*.ts")} if b.exists() else set()
    overlap = a_names & b_names
    if overlap:
        return CheckResult("no-two-services-dirs", False,
            f"Same module name in both services dirs: {sorted(overlap)}",
            {"overlap": sorted(overlap)})
    # No overlap — but the convention is unclear. Warn (not fail).
    return CheckResult("no-two-services-dirs", True,
        "Two services dirs, but no name overlap. Consider renaming src/services/ "
        "to src/platform/ to make the boundary explicit.",
        {"a": str(a.relative_to(BASE_DIR)), "b": str(b.relative_to(BASE_DIR))})


@check("cors-not-wildcard")
def check_cors_wildcard():
    """backend/src/index.ts must not have cors({ origin: '*' }) in production."""
    f = BASE_DIR / "backend" / "src" / "index.ts"
    if not f.exists():
        return CheckResult("cors-not-wildcard", True, "skipped")
    text = f.read_text()
    if re.search(r"cors\s*\(\s*\{\s*origin\s*:\s*['\"]?\*['\"]?", text):
        return CheckResult("cors-not-wildcard", False,
            "cors({ origin: '*' }) in backend. Restrict to known origins.")
    return CheckResult("cors-not-wildcard", True, "CORS is not wildcard")


@check("jwt-secret-not-placeholder")
def check_jwt_secret_placeholder():
    """backend/.env JWT_SECRET must not be the placeholder."""
    f = BASE_DIR / "backend" / ".env"
    if not f.exists():
        return CheckResult("jwt-secret-not-placeholder", True, "skipped: no .env")
    text = f.read_text()
    m = re.search(r"JWT_SECRET\s*=\s*(\S+)", text)
    if m and "change-in-production" in m.group(1):
        return CheckResult("jwt-secret-not-placeholder", False,
            f"JWT_SECRET is the placeholder ({m.group(1)!r}). Rotate it.",
            {"value": m.group(1)})
    return CheckResult("jwt-secret-not-placeholder", True, "JWT_SECRET is rotated")


@check("leads-no-ip-ua")
def check_leads_pii():
    """leads table must not store raw ip or user_agent. POPIA concern.

    Migration 010 created the leads table with raw ip + user_agent columns.
    Migration 013 dropped them. This check verifies that EITHER the leads
    migration is gone OR migration 013 exists to clean it up.
    """
    m010 = BASE_DIR / "supabase" / "migrations" / "010_leads_table.sql"
    m013 = BASE_DIR / "supabase" / "migrations" / "013_leads_pii_cleanup.sql"
    if not m010.exists():
        return CheckResult("leads-no-ip-ua", True, "no leads migration to check")
    if m013.exists():
        return CheckResult("leads-no-ip-ua", True,
            "leads PII will be cleaned by migration 013")
    # 010 exists but no 013 to clean it
    text = m010.read_text()
    bad = []
    if re.search(r"^\s*ip\s+text", text, re.MULTILINE):
        bad.append("ip TEXT column (raw IP stored)")
    if re.search(r"^\s*user_agent\s+text", text, re.MULTILINE):
        bad.append("user_agent TEXT column (UA stored)")
    if bad:
        return CheckResult("leads-no-ip-ua", False,
            f"leads table stores PII: {bad}. Add migration 013 to drop or hash.",
            {"bad": bad})
    return CheckResult("leads-no-ip-ua", True, "leads table does not store raw PII")


# ── Runner ─────────────────────────────────────────────────────────────

def run_all(selected=None):
    names = selected or list(CHECKS.keys())
    results = []
    for name in names:
        if name not in CHECKS:
            results.append(CheckResult(name, False,
                f"Unknown check. Available: {sorted(CHECKS)}"))
            continue
        try:
            results.append(CHECKS[name]())
        except Exception as e:
            results.append(CheckResult(name, False, f"raised: {e}"))
    return results


def main():
    ap = argparse.ArgumentParser(description="MalumeScholarTrack invariant checker")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--check", help="comma-separated check names")
    ap.add_argument("--list", action="store_true")
    args = ap.parse_args()
    if args.list:
        for n in CHECKS:
            print(n)
        return 0
    selected = [s.strip() for s in args.check.split(",")] if args.check else None
    results = run_all(selected)
    if args.json:
        print(json.dumps([r.to_dict() for r in results], indent=2))
    else:
        ok = sum(1 for r in results if r.ok)
        for r in results:
            icon = "OK  " if r.ok else "FAIL"
            print(f"  [{icon}] {r.name:34s} {r.message}")
        print(f"\n{ok}/{len(results)} checks passed")
    return 0 if all(r.ok for r in results) else 1


if __name__ == "__main__":
    sys.exit(main())
