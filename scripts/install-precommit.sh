#!/usr/bin/env bash
# install-precommit.sh — wire a secret-scanner into .git/hooks/pre-commit
# Fails the commit if any tracked file contains a known secret pattern.

set -e
cd "$(git rev-parse --show-toplevel)"

HOOK=.git/hooks/pre-commit
if [ -f "$HOOK" ] && ! grep -q "malumescholartrack-secret-scanner" "$HOOK" 2>/dev/null; then
  echo "ERROR: $HOOK already exists. Backing up to $HOOK.bak"
  mv "$HOOK" "$HOOK.bak"
fi

cat > "$HOOK" <<'EOF'
#!/usr/bin/env bash
# malumescholartrack-secret-scanner — fail if any tracked file in the diff has
# a credential pattern. Excludes .env.example, SECRETS_OPS.md, and the
# doctor itself (which lists the patterns).
set -e
PATTERNS='sk_live_[A-Za-z0-9]{20,}|sk_test_[A-Za-z0-9]{20,}|AIzaSy[A-Za-z0-9_-]{30,}|eyJhbGciOi[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'
EXCLUDES='--exclude=.env.example --exclude=SECRETS_OPS.md --exclude=malumescholartrack_doctor.py --exclude=install-precommit.sh'

# Scan only staged changes
STAGED=$(git diff --cached --name-only --diff-filter=ACMR $EXCLUDES 2>/dev/null)
if [ -z "$STAGED" ]; then
  exit 0
fi

FAIL=0
for f in $STAGED; do
  if [ -f "$f" ] && grep -E -q "$PATTERNS" "$f" 2>/dev/null; then
    echo "BLOCKED: $f contains a secret pattern. Remove it or rotate the key."
    grep -E -n "$PATTERNS" "$f" | head -3
    FAIL=1
  fi
done

if [ "$FAIL" = "1" ]; then
  echo ""
  echo "If this is a false positive (e.g. a JWT in test fixtures),"
  echo "add the file to the EXCLUDES list in .git/hooks/pre-commit."
  exit 1
fi
EOF
chmod +x "$HOOK"
echo "Installed pre-commit hook at $HOOK"
echo "Test it: git diff --cached | head"
