@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ==============================================
REM JRMSU AI Library System - One-click launcher
REM - Starts Ollama (optional), Python backend, Vite dev server
REM - Injects env vars for aligning to existing server/routes
REM ==============================================

REM -------- Config: change as needed (or set in your system env) --------
set VITE_API_BASE=http://127.0.0.1:5001
set VITE_AUTH_API_BASE=http://127.0.0.1:5001
set VITE_AUTH_REQUEST_RESET_PATH=/auth/request-reset
set VITE_AUTH_VERIFY_CODE_PATH=/auth/verify-code
set VITE_AUTH_RESET_PASSWORD_PATH=/auth/reset-password

REM AI base: use backend proxy (e.g., http://127.0.0.1:5001) OR direct Ollama (http://localhost:11434)
REM To proxy via python-backend, uncomment next 3 lines and comment the direct Ollama lines
REM set VITE_AI_API_BASE=http://127.0.0.1:5001
REM set VITE_AI_CHAT_PATH=/ai/chat
REM set VITE_AI_HEALTH_PATH=/health

REM Direct Ollama (default)
set VITE_AI_API_BASE=http://localhost:11434
set VITE_AI_CHAT_PATH=/api/chat
set VITE_AI_HEALTH_PATH=/api/tags

REM Frontend dev server port
set DEV_PORT=8080

REM -------- Paths --------
set ROOT=%~dp0
set PY_BACKEND=%ROOT%python-backend

REM -------- Optional: start Ollama if available --------
where ollama >NUL 2>&1
if %ERRORLEVEL%==0 (
  echo [Ollama] Launching 'ollama serve' (close this window to stop Ollama)...
  start "Ollama" cmd /K ollama serve
) else (
  echo [Ollama] Not found in PATH. Skipping. If needed, install and add to PATH.
)

REM -------- Python backend: install deps (first run) --------
if exist "%PY_BACKEND%\requirements.txt" (
  echo [Backend] Ensuring Python dependencies...
  pushd "%PY_BACKEND%"
  python -m pip install -r requirements.txt --quiet
  popd
)

REM -------- Start Python backend (port 5001) --------
if exist "%PY_BACKEND%\app.py" (
  if exist "%PY_BACKEND%\.venv\Scripts\activate.bat" (
    echo [Backend] Starting Python server with venv on http://127.0.0.1:5001 ...
    start "Backend :5001" cmd /K "cd /D \"%PY_BACKEND%\" && call .venv\Scripts\activate.bat && python app.py"
  ) else (
    echo [Backend] Starting Python server on http://127.0.0.1:5001 ...
    start "Backend :5001" cmd /K "cd /D \"%PY_BACKEND%\" && python app.py"
  )
) else (
  echo [Backend] app.py not found under %PY_BACKEND% (skipping backend start)
)

REM -------- Frontend: install deps on first run --------
if not exist "%ROOT%node_modules" (
  echo [Frontend] Installing node dependencies (first run)...
  pushd "%ROOT%"
  call npm ci || call npm install
  popd
)

REM -------- Start Vite dev server with env vars --------
set BROWSER=none
set VITE_FORCE=true

echo [Frontend] Starting Vite on http://localhost:%DEV_PORT% ...
start "Frontend :%DEV_PORT%" cmd /K "cd /D \"%ROOT%\" && set VITE_API_BASE=%VITE_API_BASE% && set VITE_AUTH_API_BASE=%VITE_AUTH_API_BASE% && set VITE_AUTH_REQUEST_RESET_PATH=%VITE_AUTH_REQUEST_RESET_PATH% && set VITE_AUTH_VERIFY_CODE_PATH=%VITE_AUTH_VERIFY_CODE_PATH% && set VITE_AUTH_RESET_PASSWORD_PATH=%VITE_AUTH_RESET_PASSWORD_PATH% && set VITE_AI_API_BASE=%VITE_AI_API_BASE% && set VITE_AI_CHAT_PATH=%VITE_AI_CHAT_PATH% && set VITE_AI_HEALTH_PATH=%VITE_AI_HEALTH_PATH% && npm run dev -- --port %DEV_PORT%"

REM -------- Open browser --------
start http://localhost:%DEV_PORT%

echo.
echo All services started (if available):
echo  - Python backend: http://127.0.0.1:5001
echo  - Frontend:       http://localhost:%DEV_PORT%
echo  - Ollama API:     %VITE_AI_API_BASE%
echo.
echo To stop: close the opened terminal windows.
echo.
echo This launcher window will stay open so you can see any errors. Press any key to exit it.
pause

endlocal
