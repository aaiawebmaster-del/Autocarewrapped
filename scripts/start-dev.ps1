# Start the Vite dev server for Auto Care Wrapped
$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$npm = $null
foreach ($candidate in @(
    "npm",
    "$env:ProgramFiles\nodejs\npm.cmd",
    "${env:ProgramFiles(x86)}\nodejs\npm.cmd"
)) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) {
        $npm = $candidate
        break
    }
}

if (-not $npm) {
    Write-Host "Node.js is not installed. Install from https://nodejs.org/ then run this script again." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies (first time only)..."
    & $npm install
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "Starting dev server..." -ForegroundColor Cyan
Write-Host "When you see 'Local: http://localhost:5173/' open that URL in your browser." -ForegroundColor Green
Write-Host "Leave this window open while you preview. Press Ctrl+C to stop." -ForegroundColor Yellow
Write-Host ""

& $npm run dev
