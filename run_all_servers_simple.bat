@echo off
REM Simple version - Just start all servers without checks

title JRMSU Library System - Quick Start

echo Starting all servers...
echo.

REM Backend API (Port 5000)
echo Starting Backend API (Port 5000)...
cd /d "%~dp0jrmsu-wise-library-main\python-backend"
start "Backend - Port 5000" cmd /k ".venv\Scripts\activate && python app.py"

REM Main System (Port 8080)
echo Starting Main System (Port 8080)...
cd /d "%~dp0jrmsu-wise-library-main"
start "Main System - Port 8080" cmd /k "npm run dev"

REM Mirror Page (Port 8081)
echo Starting Mirror Page (Port 8081)...
cd /d "%~dp0mirror-login-page"
start "Mirror Page - Port 8081" cmd /k "npm run dev"

REM Ollama AI (Port 11434)
echo Starting Ollama AI (Port 11434)...
start "Ollama AI - Port 11434" cmd /k "ollama serve"

echo.
echo All servers are starting!
echo.
echo URLs:
echo   Backend:      http://localhost:5000
echo   Main System:  http://localhost:8080
echo   Mirror Page:  http://localhost:8081
echo   Ollama AI:    http://localhost:11434
echo.
echo Wait 10-15 seconds, then open:
echo   http://localhost:8080  (Main System)
echo   http://localhost:8081  (Mirror Page)
echo.
pause
