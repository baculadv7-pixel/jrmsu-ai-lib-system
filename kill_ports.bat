@echo off
REM ============================================================
REM  kill_ports.bat
REM  Usage: kill_ports.bat [PORT]
REM  Frees the specified port by terminating any process using it.
REM ============================================================

if "%~1"=="" (
  echo Usage: kill_ports.bat [PORT]
  exit /b 1
)

set PORT=%~1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%"') do (
  echo [ENFORCE] Port %PORT% in use by PID %%a. Terminating...
  taskkill /PID %%a /F >nul 2>&1
)
echo [OK] Port %PORT% is now free.
exit /b 0
