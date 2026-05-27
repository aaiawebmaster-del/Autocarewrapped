# Push local Autocare Wrapped changes to GitHub
# Repo: https://github.com/aaiawebmaster-del/Autocarewrapped

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$git = $null
foreach ($candidate in @(
    "git",
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files\Git\bin\git.exe"
)) {
    if (Get-Command $candidate -ErrorAction SilentlyContinue) {
        $git = $candidate
        break
    }
}

if (-not $git) {
    Write-Host "Git is not installed or not on PATH. Install from https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

$remoteUrl = "https://github.com/aaiawebmaster-del/Autocarewrapped.git"

if (-not (Test-Path ".git")) {
    Write-Host "Initializing git repository..."
    & $git init
    & $git remote add origin $remoteUrl
} else {
    $existing = & $git remote get-url origin 2>$null
    if (-not $existing) {
        & $git remote add origin $remoteUrl
    } elseif ($existing -ne $remoteUrl) {
        Write-Host "Updating origin remote to $remoteUrl"
        & $git remote set-url origin $remoteUrl
    }
}

& $git add -A
& $git status

$hasChanges = & $git status --porcelain
if (-not $hasChanges) {
    Write-Host "Nothing to commit - working tree is clean."
    exit 0
}

$commitMsg = "Add Under the Hood dipstick flow, TrendLens tire hub, and DemandIndex roll transition."

& $git commit -m $commitMsg

$branch = (& $git branch --show-current 2>$null)
if (-not $branch) {
    & $git branch -M main
    $branch = "main"
}

Write-Host "Pushing to origin/$branch ..."
& $git push -u origin $branch

Write-Host "Done. See https://github.com/aaiawebmaster-del/Autocarewrapped" -ForegroundColor Green
