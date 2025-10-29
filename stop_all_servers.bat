@echo off
REM Stop all JRMSU Library System servers

title JRMSU Library System - Stop All Servers

color 0C
echo.
echo ============================================================
echo   STOPPING ALL JRMSU LIBRARY SYSTEM SERVERS
echo ============================================================
echo.

echo Stopping servers on ports: 5000, 8080, 8081, 11434...
echo.

REM Kill processes on specific ports
echo [1/4] Stopping Backend API (Port 5000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    if %errorLevel% == 0 (
        echo       [OK] Backend stopped
    )
)

echo [2/4] Stopping Main System (Port 8080)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    if %errorLevel% == 0 (
        echo       [OK] Main System stopped
    )
)

echo [3/4] Stopping Mirror Page (Port 8081)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8081" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    if %errorLevel% == 0 (
        echo       [OK] Mirror Page stopped
    )
)

echo [4/4] Stopping Ollama AI (Port 11434)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":11434" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    if %errorLevel% == 0 (
        echo       [OK] Ollama AI stopped
    )
)

REM Also kill Node.js and Python processes related to the project
echo.
echo Cleaning up remaining processes...
taskkill /F /IM "node.exe" /FI "WINDOWTITLE eq Main System*" >nul 2>&1
taskkill /F /IM "node.exe" /FI "WINDOWTITLE eq Mirror Page*" >nul 2>&1
taskkill /F /IM "python.exe" /FI "WINDOWTITLE eq Backend*" >nul 2>&1

echo.
echo ============================================================
echo   ALL SERVERS STOPPED!
echo ============================================================
echo.
pause
