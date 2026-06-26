# verify.ps1 — C1 · B.1.1 Implementation Capability
# Usage: pwsh labs/challenge-1-implementation/verify.ps1
# Run from the repo root.

$Pass = 0; $Fail = 0; $Warn = 0

function CheckPass([string]$msg) { Write-Host "  ✅  $msg" -ForegroundColor Green;   $script:Pass++ }
function CheckFail([string]$msg) { Write-Host "  ❌  $msg" -ForegroundColor Red;    $script:Fail++ }
function CheckWarn([string]$msg) { Write-Host "  ⚠️   $msg" -ForegroundColor Yellow; $script:Warn++ }

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════"
Write-Host "  C1 · B.1.1 — Implementation Capability Verification"
Write-Host "═══════════════════════════════════════════════════════"
Write-Host ""

# ── 1. Bicep compile ─────────────────────────────────────────────────────────
Write-Host "── 1. Bicep compile check ──"
if (Get-Command az -ErrorAction SilentlyContinue) {
    $result = az bicep build --file infra/main.bicep --stdout 2>&1
    if ($LASTEXITCODE -eq 0) {
        CheckPass "az bicep build --file infra/main.bicep succeeded"
    } else {
        CheckFail "az bicep build --file infra/main.bicep FAILED — run it manually to see errors"
    }
} else {
    CheckWarn "Azure CLI not found — skipping Bicep compile check"
}

# ── 2. Evidence folder ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "── 2. Evidence folder ──"
$EvidenceDir = "Module B/B1.1"
if (Test-Path $EvidenceDir) {
    CheckPass "Evidence folder '$EvidenceDir' exists"
} else {
    CheckWarn "Evidence folder '$EvidenceDir' not found — create it and save artefacts there"
}

# ── 3. Evidence artefacts ────────────────────────────────────────────────────
Write-Host ""
Write-Host "── 3. Evidence artefacts ──"
@("B11_CaseStudy_v1", "B11_ArchitectureDiagram_v1", "B11_CapabilityStatement_v1") | ForEach-Object {
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
Write-Host "───────────────────────────────────────────────────────"
Write-Host "  Results: $Pass passed · $Warn warnings · $Fail failed"
Write-Host "───────────────────────────────────────────────────────"

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
    Write-Host "  ✅  All checks passed! You are ready to proceed to C2." -ForegroundColor Green
    exit 0
}
