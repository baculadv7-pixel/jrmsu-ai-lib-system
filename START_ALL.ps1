# START_ALL.ps1 - Start all JRMSU Library Systems
# Run this script to start all systems at once

Write-Host "🚀 Starting JRMSU Library System..." -ForegroundColor Green
Write-Host ""

# Check if MySQL is running
Write-Host "1️⃣ Checking MySQL..." -ForegroundColor Cyan
$mysqlRunning = Get-Process mysqld -ErrorAction SilentlyContinue
if ($mysqlRunning) {
    Write-Host "   ✅ MySQL is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ MySQL is not running. Please start MySQL first!" -ForegroundColor Red
    Write-Host "   Start MySQL via XAMPP or run: net start MySQL80" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# Start Backend
Write-Host ""
Write-Host "2️⃣ Starting Backend API (Port 5000)..." -ForegroundColor Cyan
$backendPath = Join-Path $PSScriptRoot "jrmsu-wise-library-main\python-backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; .venv\Scripts\activate; python app.py"
Write-Host "   ✅ Backend starting..." -ForegroundColor Green
Start-Sleep -Seconds 3

# Start Main System
Write-Host ""
Write-Host "3️⃣ Starting Main System (Port 8080)..." -ForegroundColor Cyan
$mainPath = Join-Path $PSScriptRoot "jrmsu-wise-library-main"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mainPath'; npm run dev"
Write-Host "   ✅ Main System starting..." -ForegroundColor Green
Start-Sleep -Seconds 3

# Start Mirror Page
Write-Host ""
Write-Host "4️⃣ Starting Mirror Page (Port 8081)..." -ForegroundColor Cyan
$mirrorPath = Join-Path $PSScriptRoot "mirror-login-page"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$mirrorPath'; npm run dev"
Write-Host "   ✅ Mirror Page starting..." -ForegroundColor Green
Start-Sleep -Seconds 3

# Check Ollama
Write-Host ""
Write-Host "5️⃣ Checking Ollama AI (Port 11434)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Ollama is not running" -ForegroundColor Yellow
    Write-Host "   Start it with: ollama serve" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "✅ All systems started!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Cyan
Write-Host "   Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "   Main System:  http://localhost:8080" -ForegroundColor White
Write-Host "   Mirror Page:  http://localhost:8081" -ForegroundColor White
Write-Host "   Ollama AI:    http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Wait 10-15 seconds for all systems to fully start" -ForegroundColor Gray
Write-Host "   - Check each terminal window for startup messages" -ForegroundColor Gray
Write-Host "   - Press Ctrl+C in each terminal to stop a system" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
