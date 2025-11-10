@echo off
REM ============================================================
REM  JRMSU AI Library System - Enforced Startup (BAT)
REM  Dedicated Ports: 8080 Main | 8081 Mirror | 5000 Backend | 5002 AI | 11434 Ollama
REM ============================================================

setlocal enabledelayedexpansion
color 0A
title JRMSU Library System - ENFORCED STARTUP

set ROOT=%~dp0

echo.
echo ============================================================
echo   JRMSU Library - ENFORCED STARTUP
echo   (Reclaiming reserved ports before start)
echo ============================================================
echo.

REM --- Ensure ports are free ---
for %%P in (8080 8081 5000 5002 11434) do (
  call "%ROOT%kill_ports.bat" %%P >nul 2>&1
)

REM --- Backend (5000) ---
echo [1/5] Starting Backend (5000)...
cd /d "%ROOT%jrmsu-wise-library-main\python-backend"
if exist ".venv\Scripts\activate.bat" (
  start "Backend - 5000" cmd /k "color 0B && title Backend - 5000 && .venv\Scripts\activate && python app.py"
) else (
  start "Backend - 5000" cmd /k "color 0B && title Backend - 5000 && python app.py"
)

REM --- Main (8080) ---
echo [2/5] Starting Main (8080)...
cd /d "%ROOT%jrmsu-wise-library-main"
start "Main - 8080" cmd /k "color 0E && title Main - 8080 && npm run dev"

REM --- Mirror (8081) ---
echo [3/5] Starting Mirror (8081)...
cd /d "%ROOT%mirror-login-page"
start "Mirror - 8081" cmd /k "color 0D && title Mirror - 8081 && npm run dev"

REM --- AI Server (5002) ---
echo [4/5] Starting AI Server (5002)...
cd /d "%ROOT%ai_server"
if exist "app.py" (
  start "AI Server - 5002" cmd /k "color 0C && title AI Server - 5002 && python app.py"
) else (
  echo [WARN] ai_server\app.py not found
)

REM --- Ollama (11434) ---
echo [5/5] Checking/Starting Ollama (11434)...
where ollama >nul 2>&1
if %errorlevel%==0 (
  start "Ollama - 11434" cmd /k "color 0C && title Ollama - 11434 && set OLLAMA_HOST=127.0.0.1:11434 && ollama serve"
) else (
  echo [WARN] Ollama not installed.
)

cd /d "%ROOT%"
echo.
echo ============================================================
echo   All services launched successfully on enforced ports.
echo ============================================================
echo.
pause
