@echo off
REM =============================================================
REM JRMSU AI-Library System - Start_all_system.bat
REM -------------------------------------------------------------
REM This batch file runs the PowerShell script Start-All-Enforced.ps1
REM to start ALL services (backend, main app, mirror app, AI server,
REM and Ollama) with enforced ports.
REM =============================================================

setlocal

REM Change directory to the folder where this batch file lives
cd /d "%~dp0"

REM Run the PowerShell startup script with ExecutionPolicy bypassed
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-All-Enforced.ps1

echo.
echo All services have been launched (each in its own PowerShell window).
echo If some windows did not open, check Start-All-Enforced.ps1 for errors.
echo.
pause

endlocal
