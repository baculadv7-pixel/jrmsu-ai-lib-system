@echo off
REM Kill processes on specific ports

title Kill Ports - JRMSU Library System

color 0C
echo.
echo ============================================================
echo   KILL PORTS - JRMSU LIBRARY SYSTEM
echo ============================================================
echo.

if "%1"=="" (
    echo Usage: kill_ports.bat [port_number]
    echo        kill_ports.bat all
    echo.
    echo Examples:
    echo   kill_ports.bat 8081        - Kill process on port 8081
    echo   kill_ports.bat all         - Kill all system ports
    echo.
    
    REM If no argument, show current ports in use
    echo Current ports in use:
    echo.
    powershell -Command "Get-NetTCPConnection -LocalPort 5000,8080,8081,11434 -ErrorAction SilentlyContinue | Select-Object LocalPort,OwningProcess,State | Format-Table"
    echo.
    
    REM Ask user what to do
    echo What would you like to do?
    echo   1. Kill port 5000 (Backend)
    echo   2. Kill port 8080 (Main System)
    echo   3. Kill port 8081 (Mirror Page)
    echo   4. Kill port 11434 (Ollama)
    echo   5. Kill ALL ports
    echo   6. Exit
    echo.
    set /p choice="Enter choice (1-6): "
    
    if "%choice%"=="1" goto kill5000
    if "%choice%"=="2" goto kill8080
    if "%choice%"=="3" goto kill8081
    if "%choice%"=="4" goto kill11434
    if "%choice%"=="5" goto killall
    if "%choice%"=="6" goto end
    
    echo Invalid choice!
    goto end
)

if "%1"=="all" goto killall
if "%1"=="5000" goto kill5000
if "%1"=="8080" goto kill8080
if "%1"=="8081" goto kill8081
if "%1"=="11434" goto kill11434

REM Kill specific port passed as argument
echo Killing process on port %1...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%1"') do (
    taskkill /F /PID %%a >nul 2>&1
    if %errorLevel% == 0 (
        echo [OK] Process on port %1 killed
    )
)
goto end

:kill5000
echo Killing Backend API (Port 5000)...
powershell -Command "$conn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force; Write-Host '[OK] Port 5000 freed' } else { Write-Host '[INFO] Port 5000 is not in use' }"
goto end

:kill8080
echo Killing Main System (Port 8080)...
powershell -Command "$conn = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force; Write-Host '[OK] Port 8080 freed' } else { Write-Host '[INFO] Port 8080 is not in use' }"
goto end

:kill8081
echo Killing Mirror Page (Port 8081)...
powershell -Command "$conn = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force; Write-Host '[OK] Port 8081 freed' } else { Write-Host '[INFO] Port 8081 is not in use' }"
goto end

:kill11434
echo Killing Ollama AI (Port 11434)...
powershell -Command "$conn = Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force; Write-Host '[OK] Port 11434 freed' } else { Write-Host '[INFO] Port 11434 is not in use' }"
goto end

:killall
echo.
echo Killing ALL system ports...
echo.

echo [1/4] Killing Backend API (Port 5000)...
powershell -Command "$conn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force; Write-Host '      [OK] Port 5000 freed' } else { Write-Host '      [INFO] Port 5000 is not in use' }"

echo [2/4] Killing Main System (Port 8080)...
powershell -Command "$conn = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force; Write-Host '      [OK] Port 8080 freed' } else { Write-Host '      [INFO] Port 8080 is not in use' }"

echo [3/4] Killing Mirror Page (Port 8081)...
powershell -Command "$conn = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force; Write-Host '      [OK] Port 8081 freed' } else { Write-Host '      [INFO] Port 8081 is not in use' }"

echo [4/4] Killing Ollama AI (Port 11434)...
powershell -Command "$conn = Get-NetTCPConnection -LocalPort 11434 -ErrorAction SilentlyContinue; if ($conn) { Stop-Process -Id $conn.OwningProcess -Force; Write-Host '      [OK] Port 11434 freed' } else { Write-Host '      [INFO] Port 11434 is not in use' }"

echo.
echo ============================================================
echo   ALL PORTS FREED!
echo ============================================================
goto end

:end
echo.
pause
