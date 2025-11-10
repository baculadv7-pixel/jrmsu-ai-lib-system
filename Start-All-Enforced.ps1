# =============================================================
# JRMSU AI Library - Enforced Startup (PowerShell)
# =============================================================

[CmdletBinding()]
param()
$ErrorActionPreference = 'SilentlyContinue'

function Ensure-PortFree {
  param([int]$Port)
  $pids = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -Expand OwningProcess -Unique
  if ($pids) {
    Write-Host "[ENFORCE] Port $Port in use by PID(s): $($pids -join ', ') -> terminating..." -ForegroundColor Yellow
    foreach ($pid in $pids) { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Milliseconds 200
  }
  Write-Host "[OK] Port $Port is now free." -ForegroundColor Green
}

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host "JRMSU AI Library - ENFORCED STARTUP" -ForegroundColor White
Write-Host "=============================================================" -ForegroundColor Cyan

# Enforce reserved ports
foreach ($p in 8080,8081,5000,5002,11434) { Ensure-PortFree -Port $p }

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root 'jrmsu-wise-library-main\python-backend'
$main = Join-Path $root 'jrmsu-wise-library-main'
$mirror = Join-Path $root 'mirror-login-page'
$ai = Join-Path $root 'ai_server'

# Backend (5000)
Write-Host "[1/5] Starting Backend (5000)..." -ForegroundColor Cyan
if (Test-Path (Join-Path $backend '.venv\Scripts\Activate.ps1')) {
  Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$backend'; . .venv\Scripts\Activate.ps1; python app.py" -WindowStyle Normal
} else {
  Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$backend'; python app.py" -WindowStyle Normal
}

# Main (8080)
Write-Host "[2/5] Starting Main (8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$main'; npm run dev" -WindowStyle Normal

# Mirror (8081)
Write-Host "[3/5] Starting Mirror (8081)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$mirror'; npm run dev" -WindowStyle Normal

# AI (5002)
Write-Host "[4/5] Starting AI Server (5002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$ai'; python app.py" -WindowStyle Normal

# Ollama (11434)
Write-Host "[5/5] Starting Ollama (11434)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","$env:OLLAMA_HOST='127.0.0.1:11434'; ollama serve" -WindowStyle Normal

Write-Host "`n=============================================================" -ForegroundColor Cyan
Write-Host " All services launched successfully with enforced ports." -ForegroundColor Green
Write-Host "=============================================================" -ForegroundColor Cyan
pause
