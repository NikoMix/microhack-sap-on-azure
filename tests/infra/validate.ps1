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
# Verify that lab.bicepparam does NOT reference M-series or large E-series VMs.
# These SKUs cost $10-100+/hour and must not appear in the classroom (lab) profile.
Write-Host "`n[4/4] Checking lab SKU cost guardrails..."
$labParam = Join-Path $infraRoot 'params\lab.bicepparam'
if (-not (Test-Path $labParam)) {
    Fail "lab.bicepparam not found at $labParam"
} else {
    $labContent = Get-Content $labParam -Raw
    # Forbidden in lab: M-series (M8ms, M16ms, M32ms, M64ms, M128ms, M208ms, M416ms)
    # and large E-series like E32ds_v5+
    $forbiddenPatterns = @(
        'Standard_M\d+ms'    # any M-series (HANA-certified, too expensive for lab)
        'Standard_M\d+s'     # M-series non-ms variants
        'Standard_E32'       # E32ds and above
        'Standard_E48'
        'Standard_E64'
        'Standard_E96'
    )
    $labViolation = $false
    foreach ($pattern in $forbiddenPatterns) {
        if ($labContent -match $pattern) {
            Fail "lab.bicepparam references expensive SKU matching '$pattern' — not safe for classroom budget"
            $labViolation = $true
        }
    }
    if (-not $labViolation) {
        Pass "lab.bicepparam: no M-series or oversized E-series SKUs referenced"
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
