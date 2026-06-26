#!/usr/bin/env bash
# verify.sh — C1 · B.1.1 Implementation Capability
# Usage: bash labs/challenge-1-implementation/verify.sh
# Run from the repo root.

set -euo pipefail

PASS=0
FAIL=0
WARN=0

check_pass() { echo "  ✅  $1"; ((PASS+=1)); }
check_fail() { echo "  ❌  $1"; ((FAIL+=1)); }
check_warn() { echo "  ⚠️   $1"; ((WARN+=1)); }

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  C1 · B.1.1 — Implementation Capability Verification"
echo "═══════════════════════════════════════════════════════"
echo ""

# ── 1. Bicep compile ─────────────────────────────────────────────────────────
echo "── 1. Bicep compile check ──"
if command -v az &>/dev/null; then
  if az bicep build --file infra/main.bicep --stdout > /dev/null 2>&1; then
    check_pass "az bicep build --file infra/main.bicep succeeded"
  else
    check_fail "az bicep build --file infra/main.bicep FAILED — run it manually to see errors"
  fi
else
  check_warn "Azure CLI not found — skipping Bicep compile check"
fi

# ── 2. Evidence folder ───────────────────────────────────────────────────────
echo ""
echo "── 2. Evidence folder ──"
EVIDENCE_DIR="Module B/B1.1"
if [ -d "$EVIDENCE_DIR" ]; then
  check_pass "Evidence folder '$EVIDENCE_DIR' exists"
else
  check_warn "Evidence folder '$EVIDENCE_DIR' not found — create it and save artefacts there"
fi

# ── 3. Evidence artefacts ────────────────────────────────────────────────────
echo ""
echo "── 3. Evidence artefacts ──"
for PATTERN in "B11_CaseStudy_v1" "B11_ArchitectureDiagram_v1" "B11_CapabilityStatement_v1"; do
  if ls "$EVIDENCE_DIR"/${PATTERN}.* 2>/dev/null | grep -q .; then
    check_pass "Found: $PATTERN.*"
  else
    check_warn "Missing: $EVIDENCE_DIR/$PATTERN.* — generate and save from the lab steps"
  fi
done

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "───────────────────────────────────────────────────────"
echo "  Results: $PASS passed · $WARN warnings · $FAIL failed"
echo "───────────────────────────────────────────────────────"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "  ❌  One or more checks FAILED. Fix before moving on."
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo ""
  echo "  ⚠️   Warnings present — complete all lab steps to resolve."
  exit 0
else
  echo ""
  echo "  ✅  All checks passed! You are ready to proceed to C2."
  exit 0
fi
