@echo off
REM ============================================================
REM  JRMSU AI Library System - Start All Servers
REM  This script starts all required services
REM ============================================================

color 0A
title JRMSU Library System - Startup Manager

echo.
echo ============================================================
echo   JRMSU AI LIBRARY SYSTEM - STARTUP MANAGER
echo ============================================================
echo.

REM Check if running as Administrator (optional but recommended)
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Running with Administrator privileges
) else (
    echo [WARN] Not running as Administrator - some features may not work
)

echo.
echo ============================================================
echo   CHECKING PREREQUISITES
echo ============================================================
echo.

REM Check MySQL
echo [1/5] Checking MySQL Database (Port 3306)...
netstat -an | findstr ":3306" | findstr "LISTENING" >nul
if %errorLevel% == 0 (
    echo       [OK] MySQL is running on port 3306
) else (
    echo       [ERROR] MySQL is not running!
    echo       Please start MySQL via XAMPP or run: net start MySQL80
    echo.
    pause
    exit /b 1
)

REM Check Node.js
echo [2/5] Checking Node.js...
where node >nul 2>&1
if %errorLevel% == 0 (
    echo       [OK] Node.js is installed
) else (
    echo       [ERROR] Node.js is not installed!
    echo       Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check Python
echo [3/5] Checking Python...
where python >nul 2>&1
if %errorLevel% == 0 (
    echo       [OK] Python is installed
) else (
    echo       [ERROR] Python is not installed!
    echo       Please install Python from https://python.org/
    echo.
    pause
    exit /b 1
)

REM Check if ports are available
echo [4/5] Checking if ports are available...
netstat -an | findstr ":5000" | findstr "LISTENING" >nul
if %errorLevel% == 0 (
    echo       [WARN] Port 5000 is already in use - Backend may fail to start
) else (
    echo       [OK] Port 5000 is available
)

netstat -an | findstr ":8080" | findstr "LISTENING" >nul
if %errorLevel% == 0 (
    echo       [WARN] Port 8080 is already in use - Main System may fail to start
) else (
    echo       [OK] Port 8080 is available
)

netstat -an | findstr ":8081" | findstr "LISTENING" >nul
if %errorLevel% == 0 (
    echo       [WARN] Port 8081 is already in use - Mirror Page may fail to start
) else (
    echo       [OK] Port 8081 is available
)

REM Check Ollama
echo [5/5] Checking Ollama AI (Port 11434)...
netstat -an | findstr ":11434" | findstr "LISTENING" >nul
if %errorLevel% == 0 (
    echo       [OK] Ollama is running on port 11434
) else (
    echo       [WARN] Ollama is not running - AI features will not work
    echo       Start it with: ollama serve
)

echo.
echo ============================================================
echo   STARTING SERVICES
echo ============================================================
echo.

REM Start Backend API (Port 5000)
echo [1/4] Starting Backend API (Port 5000)...
cd /d "%~dp0jrmsu-wise-library-main\python-backend"
if exist ".venv\Scripts\activate.bat" (
    start "Backend API - Port 5000" cmd /k "color 0B && title Backend API - Port 5000 && .venv\Scripts\activate && python app.py"
    echo       [OK] Backend API starting...
    timeout /t 3 /nobreak >nul
) else (
    echo       [ERROR] Virtual environment not found!
    echo       Please create venv: python -m venv .venv
    pause
    exit /b 1
)

REM Start Main System (Port 8080)
echo [2/4] Starting Main System (Port 8080)...
cd /d "%~dp0jrmsu-wise-library-main"
if exist "package.json" (
    start "Main System - Port 8080" cmd /k "color 0E && title Main System - Port 8080 && npm run dev"
    echo       [OK] Main System starting...
    timeout /t 3 /nobreak >nul
) else (
    echo       [ERROR] package.json not found!
    echo       Please run: npm install
    pause
    exit /b 1
)

REM Start Mirror Page (Port 8081)
echo [3/4] Starting Mirror Page (Port 8081)...
cd /d "%~dp0mirror-login-page"
if exist "package.json" (
    start "Mirror Page - Port 8081" cmd /k "color 0D && title Mirror Page - Port 8081 && npm run dev"
    echo       [OK] Mirror Page starting...
    timeout /t 3 /nobreak >nul
) else (
    echo       [ERROR] package.json not found!
    echo       Please run: npm install
    pause
    exit /b 1
)

REM Check/Start Ollama AI (Port 11434)
echo [4/4] Checking Ollama AI (Port 11434)...
netstat -an | findstr ":11434" | findstr "LISTENING" >nul
if %errorLevel% == 0 (
    echo       [OK] Ollama is already running
) else (
    where ollama >nul 2>&1
    if %errorLevel% == 0 (
        echo       [INFO] Starting Ollama AI...
        start "Ollama AI - Port 11434" cmd /k "color 0C && title Ollama AI - Port 11434 && ollama serve"
        timeout /t 3 /nobreak >nul
        echo       [OK] Ollama AI starting...
    ) else (
        echo       [WARN] Ollama not installed - AI features disabled
        echo       Install from: https://ollama.ai/download
    )
)

echo.
echo ============================================================
echo   ALL SERVICES STARTED!
echo ============================================================
echo.
echo   Please wait 10-15 seconds for all services to fully start
echo.
echo   SYSTEM URLS:
echo   ============================================================
echo   Backend API:     http://localhost:5000
echo   Main System:     http://localhost:8080
echo   Mirror Page:     http://localhost:8081
echo   Ollama AI:       http://localhost:11434
echo   ============================================================
echo.
echo   TIPS:
echo   - Check each terminal window for startup messages
echo   - Press Ctrl+C in each window to stop a service
echo   - Close this window to keep services running
echo.
echo   ARCHITECTURE:
echo   ============================================================
echo   Main System (8080)  --^|
echo                           +--^> Backend API (5000) --^> MySQL (3306)
echo   Mirror Page (8081)  --^|
echo                           +--^> Ollama AI (11434)
echo   ============================================================
echo.

REM Return to original directory
cd /d "%~dp0"

echo Press any key to open the systems in your browser...
pause >nul

REM Open systems in default browser
echo.
echo Opening systems in browser...
start http://localhost:8080
timeout /t 2 /nobreak >nul
start http://localhost:8081

echo.
echo ============================================================
echo   STARTUP COMPLETE!
echo ============================================================
echo.
echo   You can now close this window.
echo   The services will continue running in their own windows.
echo.
pause
