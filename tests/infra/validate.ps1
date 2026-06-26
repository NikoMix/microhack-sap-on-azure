#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Static validation for the SAP-on-Azure Module B landing zone Bicep templates.

.DESCRIPTION
    Validates the infra/ Bicep templates WITHOUT requiring an Azure subscription login:
      1. az bicep build  — all .bicep files compile without errors
      2. az bicep build-params  — both param files compile without errors
      3. No @secure() outputs  — checks that no secrets leak through module outputs
      4. Lab SKU cost guardrails  — verifies that lab.bicepparam does NOT reference
         M-series or E16+ds VM sizes (reference-only SKUs not safe for class budgets)

    Exit codes:
      0 — all checks passed
      1 — one or more checks failed (details printed to stderr)

.EXAMPLE
    pwsh tests/infra/validate.ps1
    pwsh tests/infra/validate.ps1 -InfraRoot ./infra
#>

[CmdletBinding()]
param(
    [string]$InfraRoot = (Join-Path $PSScriptRoot '..\..\infra')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'
$script:failures = 0

function Fail($message) {
    Write-Error "FAIL: $message"
    $script:failures++
}

function Pass($message) {
    Write-Host "PASS: $message" -ForegroundColor Green
}

$infraRoot = (Resolve-Path $InfraRoot).Path
Write-Host "`n── SAP infra static validation ─────────────────────────────────────────────" -ForegroundColor Cyan
Write-Host "   Infra root: $infraRoot"

# ─── 1. az bicep build on all .bicep files ────────────────────────────────────
Write-Host "`n[1/4] Compiling all .bicep files..."
$bicepFiles = Get-ChildItem -Recurse -Filter '*.bicep' $infraRoot

if (-not $bicepFiles) {
    Fail "No .bicep files found under $infraRoot"
} else {
    foreach ($f in $bicepFiles) {
        $out = az bicep build --file $f.FullName 2>&1
        if ($LASTEXITCODE -ne 0) {
            Fail "$($f.Name) failed to compile:`n$out"
        } else {
            if ($out -match 'Warning') {
                Write-Warning "$($f.Name): $out"
            }
            Pass "bicep build $($f.Name)"
        }
    }
}

# ─── 2. az bicep build-params on all .bicepparam files ───────────────────────
Write-Host "`n[2/4] Compiling all .bicepparam files..."
$paramFiles = Get-ChildItem -Recurse -Filter '*.bicepparam' $infraRoot

if (-not $paramFiles) {
    Fail "No .bicepparam files found under $infraRoot/params"
} else {
    foreach ($f in $paramFiles) {
        $out = az bicep build-params --file $f.FullName 2>&1
        if ($LASTEXITCODE -ne 0) {
            Fail "$($f.Name) failed to compile:`n$out"
        } else {
            Pass "bicep build-params $($f.Name)"
        }
    }
}

# ─── 3. Check outputs for @secure() leakage ───────────────────────────────────
# The bicepconfig.json already enforces this via analyzer rule, but we double-check
# in case a future commit changes bicepconfig.json.
Write-Host "`n[3/4] Checking outputs do not contain secrets..."
$outputSecretPattern = '@secure\(\).*\n.*output|output.*@secure\(\)'

foreach ($f in $bicepFiles) {
    $content = Get-Content $f.FullName -Raw
    # Look for any output block that directly surfaces a @secure param/var
    # Simple heuristic: if an 'output' line references a variable that appears on a @secure() decorated param line
    $secureParams = [System.Collections.Generic.HashSet[string]]::new()
    $lines = $content -split "`n"
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '@secure\(\)') {
            # Next relevant line should be `param <name>`
            for ($j = $i + 1; $j -lt [Math]::Min($i + 3, $lines.Count); $j++) {
                if ($lines[$j] -match 'param\s+(\w+)') {
                    $null = $secureParams.Add($Matches[1])
                    break
                }
            }
        }
    }
    foreach ($sp in $secureParams) {
        # Check if any output references this secure param directly
        if ($content -match "output\s+\w+\s+\w+\s*=.*\b$sp\b") {
            Fail "$($f.Name): output appears to reference @secure() param '$sp' — potential secret leakage"
        } else {
            Pass "$($f.Name): @secure() param '$sp' is not exposed in outputs"
        }
    }
    if ($secureParams.Count -eq 0) {
        Pass "$($f.Name): no @secure() params defined (no leakage possible)"
    }
}

# ─── 4. Lab SKU cost guardrails ───────────────────────────────────────────────
# Verify that the `sizing.lab` block in main.bicep does NOT define M-series or
# large E-series VM SKUs. The lab profile must stay within classroom budget.
#
# WHY scan main.bicep, not lab.bicepparam?
#   lab.bicepparam only sets `sizingProfile = 'lab'`; the actual VM SKUs live
#   in the `sizing` variable map in main.bicep. Scanning the param file gives
#   a false PASS even if the map contains an M64ms — this test catches that.
Write-Host "`n[4/4] Checking lab SKU cost guardrails (scanning main.bicep sizing.lab block)..."
$mainBicep = Join-Path $infraRoot 'main.bicep'
if (-not (Test-Path $mainBicep)) {
    Fail "main.bicep not found at $mainBicep"
} else {
    $mainContent = Get-Content $mainBicep -Raw

    # Extract the 'lab:' nested object from the sizing variable.
    # The block has no nested braces, so [^}]+ safely captures its full content.
    if ($mainContent -match '(?ms)lab:\s*\{([^}]+)\}') {
        $labBlock = $Matches[1]

        # Forbidden in the lab profile: M-series (HANA-certified, $10-100+/hr)
        # and large E-series (E32ds_v5 and above — too expensive for classroom use).
        $forbiddenPatterns = [ordered]@{
            'Standard_M\d+ms'  = 'M-series (ms variant) — HANA-certified, too expensive for lab'
            'Standard_M\d+s\b' = 'M-series (s variant) — too expensive for lab'
            'Standard_E3[2-9]' = 'E32–E96-series — oversized for classroom use'
            'Standard_E[4-9]\d'= 'E40+series — oversized for classroom use'
        }
        $labViolation = $false
        foreach ($kv in $forbiddenPatterns.GetEnumerator()) {
            if ($labBlock -match $kv.Key) {
                Fail "main.bicep sizing.lab contains forbidden SKU '$($Matches[0])': $($kv.Value)"
                $labViolation = $true
            }
        }
        if (-not $labViolation) {
            # Report the actual lab SKUs found so the output is auditable.
            $appSku = if ($labBlock -match "appVmSku:\s*'([^']+)'") { $Matches[1] } else { '(not found)' }
            $dbSku  = if ($labBlock -match "dbVmSku:\s*'([^']+)'") { $Matches[1] } else { '(not found)' }
            Pass "main.bicep sizing.lab: appVmSku=$appSku, dbVmSku=$dbSku — both within cost guardrails"
        }
    } else {
        Fail "Could not locate 'lab:' block in main.bicep sizing variable — structure may have changed"
    }
}

# ─── Summary ──────────────────────────────────────────────────────────────────
Write-Host "`n── Validation complete ─────────────────────────────────────────────────────" -ForegroundColor Cyan
if ($script:failures -eq 0) {
    Write-Host "All checks passed ✓" -ForegroundColor Green
    exit 0
} else {
    Write-Error "$($script:failures) check(s) failed. See above for details."
    exit 1
}
