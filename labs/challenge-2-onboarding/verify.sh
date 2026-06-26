#!/usr/bin/env bash
# verify.sh — C2 · B.4.2 Partner Onboarding & Migration
# Usage: bash labs/challenge-2-onboarding/verify.sh
# Run from the repo root.

set -euo pipefail

PASS=0
FAIL=0
WARN=0

check_pass() { echo "  ✅  $1"; ((PASS+=1)); }
check_fail() { echo "  ❌  $1"; ((FAIL+=1)); }
check_warn() { echo "  ⚠️   $1"; ((WARN+=1)); }

echo ""
echo "════════════════════════════════════════════════════════"
echo "  C2 · B.4.2 — Onboarding & Migration Verification"
echo "════════════════════════════════════════════════════════"
echo ""

# ── 1. Azure provider registration ───────────────────────────────────────────
echo "── 1. Azure provider registration ──"
if command -v az &>/dev/null; then
  PROV_STATE=$(az provider show -n Microsoft.Workloads --query "registrationState" -o tsv 2>/dev/null || echo "Unknown")
  if [ "$PROV_STATE" = "Registered" ]; then
    check_pass "Microsoft.Workloads provider: Registered"
  else
    check_warn "Microsoft.Workloads provider state: $PROV_STATE — run 'az provider register --namespace Microsoft.Workloads --wait'"
  fi
else
  check_warn "Azure CLI not found — skipping provider check"
fi

# ── 2. ACSS VIS ───────────────────────────────────────────────────────────────
echo ""
echo "── 2. ACSS Virtual Instance for SAP ──"
if command -v az &>/dev/null; then
  VIS_COUNT=$(az workloads sap-virtual-instance list -g rg-sapmh-lab --query "length(@)" -o tsv 2>/dev/null || echo "0")
  if [ "${VIS_COUNT:-0}" -ge 1 ]; then
    check_pass "ACSS VIS found in rg-sapmh-lab ($VIS_COUNT instance(s))"
  else
    check_warn "No ACSS VIS found in rg-sapmh-lab — complete Step 1 in the lab"
  fi
else
  check_warn "Azure CLI not found — skipping ACSS check"
fi

# ── 3. Azure Monitor for SAP ─────────────────────────────────────────────────
echo ""
echo "── 3. Azure Monitor for SAP Solutions ──"
if command -v az &>/dev/null; then
  MON_COUNT=$(az workloads monitor list -g rg-sapmh-lab --query "length(@)" -o tsv 2>/dev/null || echo "0")
  if [ "${MON_COUNT:-0}" -ge 1 ]; then
    check_pass "Azure Monitor for SAP resource found ($MON_COUNT resource(s))"
  else
    check_warn "No Monitor for SAP resource found — complete Step 2 in the lab"
  fi
else
  check_warn "Azure CLI not found — skipping Monitor check"
fi

# ── 4. Recovery Services Vault ────────────────────────────────────────────────
echo ""
echo "── 4. Azure Backup — Recovery Services Vault ──"
if command -v az &>/dev/null; then
  VAULT_COUNT=$(az backup vault list -g rg-sapmh-lab --query "length(@)" -o tsv 2>/dev/null || echo "0")
  if [ "${VAULT_COUNT:-0}" -ge 1 ]; then
    check_pass "Recovery Services Vault found ($VAULT_COUNT vault(s))"
  else
    check_warn "No Recovery Services Vault found — complete Step 3 in the lab"
  fi
else
  check_warn "Azure CLI not found — skipping Backup check"
fi

# ── 5. Evidence artefacts ────────────────────────────────────────────────────
echo ""
echo "── 5. Evidence artefacts ──"
EVIDENCE_DIR="Module B/B4.2"
for PATTERN in \
  "B42_HLD_v1" \
  "B42_LLD_v1" \
  "B42_MigrationRunbook_v1" \
  "B42_KTPlan_v1" \
  "B42_HypercarePlan_v1"; do
  if ls "$EVIDENCE_DIR"/${PATTERN}.* 2>/dev/null | grep -q .; then
    check_pass "Found: $PATTERN.*"
  else
    check_warn "Missing: $EVIDENCE_DIR/$PATTERN.* — generate and save from the lab steps"
  fi
done

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────────────────────"
echo "  Results: $PASS passed · $WARN warnings · $FAIL failed"
echo "────────────────────────────────────────────────────────"

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
  echo "  ✅  All checks passed! C2 complete — well done."
  exit 0
fi
