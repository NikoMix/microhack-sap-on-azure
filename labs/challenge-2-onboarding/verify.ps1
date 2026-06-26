# verify.ps1 — C2 · B.4.2 Partner Onboarding & Migration
# Usage: pwsh labs/challenge-2-onboarding/verify.ps1
# Run from the repo root.

$Pass = 0; $Fail = 0; $Warn = 0

function CheckPass([string]$msg) { Write-Host "  ✅  $msg" -ForegroundColor Green;   $script:Pass++ }
function CheckFail([string]$msg) { Write-Host "  ❌  $msg" -ForegroundColor Red;    $script:Fail++ }
function CheckWarn([string]$msg) { Write-Host "  ⚠️   $msg" -ForegroundColor Yellow; $script:Warn++ }

Write-Host ""
Write-Host "════════════════════════════════════════════════════════"
Write-Host "  C2 · B.4.2 — Onboarding & Migration Verification"
Write-Host "════════════════════════════════════════════════════════"
Write-Host ""

# ── 1. Azure provider registration ───────────────────────────────────────────
Write-Host "── 1. Azure provider registration ──"
if (Get-Command az -ErrorAction SilentlyContinue) {
    $provState = az provider show -n Microsoft.Workloads --query "registrationState" -o tsv 2>$null
    if ($provState -eq "Registered") {
        CheckPass "Microsoft.Workloads provider: Registered"
    } else {
        CheckWarn "Microsoft.Workloads provider state: $provState — run 'az provider register --namespace Microsoft.Workloads --wait'"
    }
} else {
    CheckWarn "Azure CLI not found — skipping provider check"
}

# ── 2. ACSS VIS ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "── 2. ACSS Virtual Instance for SAP ──"
if (Get-Command az -ErrorAction SilentlyContinue) {
    $visCount = az workloads sap-virtual-instance list -g rg-sapmh-lab --query "length(@)" -o tsv 2>$null
    if ([int]($visCount ?? 0) -ge 1) {
        CheckPass "ACSS VIS found in rg-sapmh-lab ($visCount instance(s))"
    } else {
        CheckWarn "No ACSS VIS found in rg-sapmh-lab — complete Step 1 in the lab"
    }
} else {
    CheckWarn "Azure CLI not found — skipping ACSS check"
}

# ── 3. Azure Monitor for SAP ─────────────────────────────────────────────────
Write-Host ""
Write-Host "── 3. Azure Monitor for SAP Solutions ──"
if (Get-Command az -ErrorAction SilentlyContinue) {
    $monCount = az monitor sap-monitor list -g rg-sapmh-lab --query "length(@)" -o tsv 2>$null
    if ([int]($monCount ?? 0) -ge 1) {
        CheckPass "Azure Monitor for SAP resource found ($monCount resource(s))"
    } else {
        CheckWarn "No Monitor for SAP resource found — complete Step 2 in the lab"
    }
} else {
    CheckWarn "Azure CLI not found — skipping Monitor check"
}

# ── 4. Recovery Services Vault ────────────────────────────────────────────────
Write-Host ""
Write-Host "── 4. Azure Backup — Recovery Services Vault ──"
if (Get-Command az -ErrorAction SilentlyContinue) {
    $vaultCount = az backup vault list -g rg-sapmh-lab --query "length(@)" -o tsv 2>$null
    if ([int]($vaultCount ?? 0) -ge 1) {
        CheckPass "Recovery Services Vault found ($vaultCount vault(s))"
    } else {
        CheckWarn "No Recovery Services Vault found — complete Step 3 in the lab"
    }
} else {
    CheckWarn "Azure CLI not found — skipping Backup check"
}

# ── 5. Evidence artefacts ────────────────────────────────────────────────────
Write-Host ""
Write-Host "── 5. Evidence artefacts ──"
$EvidenceDir = "Module B/B4.2"
@(
    "B42_HLD_v1",
    "B42_LLD_v1",
    "B42_MigrationRunbook_v1",
    "B42_KTPlan_v1",
    "B42_HypercarePlan_v1"
) | ForEach-Object {
    $pattern = $_
    $found = Get-ChildItem -Path $EvidenceDir -Filter "${pattern}.*" -ErrorAction SilentlyContinue
    if ($found) {
        CheckPass "Found: $($found.Name)"
    } else {
        CheckWarn "Missing: $EvidenceDir/$pattern.* — generate and save from the lab steps"
    }
}

# ── Summary ──────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "────────────────────────────────────────────────────────"
Write-Host "  Results: $Pass passed · $Warn warnings · $Fail failed"
Write-Host "────────────────────────────────────────────────────────"

if ($Fail -gt 0) {
    Write-Host ""
    Write-Host "  ❌  One or more checks FAILED. Fix before moving on." -ForegroundColor Red
    exit 1
} elseif ($Warn -gt 0) {
    Write-Host ""
    Write-Host "  ⚠️   Warnings present — complete all lab steps to resolve." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host ""
    Write-Host "  ✅  All checks passed! C2 complete — well done." -ForegroundColor Green
    exit 0
}
