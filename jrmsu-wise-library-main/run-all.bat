@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ==============================================
REM JRMSU AI Library System - One-click launcher
REM - Starts Ollama (optional), Python backend, Vite dev server
REM - Injects env vars for aligning to existing server/routes
REM ==============================================

REM -------- Config: change as needed (or set in your system env) --------
set VITE_API_BASE=http://localhost:5000
set VITE_AUTH_API_BASE=http://localhost:5000
set VITE_AUTH_REQUEST_RESET_PATH=/auth/request-reset
set VITE_AUTH_VERIFY_CODE_PATH=/auth/verify-code
set VITE_AUTH_RESET_PASSWORD_PATH=/auth/reset-password

REM AI base: use backend proxy (e.g., http://127.0.0.1:5001) OR direct Ollama (http://localhost:11434)
REM To proxy via python-backend, uncomment next 3 lines and comment the direct Ollama lines
REM set VITE_AI_API_BASE=http://127.0.0.1:5001
REM set VITE_AI_CHAT_PATH=/ai/chat
REM set VITE_AI_HEALTH_PATH=/health

REM Proxy AI via backend
set VITE_AI_API_BASE=http://localhost:5000
set VITE_AI_CHAT_PATH=/api/ai/chat
set VITE_AI_HEALTH_PATH=/health

REM Frontend dev server port
set DEV_PORT=8080

REM -------- Paths --------
set ROOT=%~dp0
set PY_BACKEND=%ROOT%python-backend

REM ==============================================
REM Environment Setup (merged from setup-all.bat)
REM - Verifies Node/npm and installs frontend deps if needed
REM - Verifies Python, creates venv, installs backend deps
REM - Checks Ollama model presence (optional)
REM ==============================================

REM ---- Free ports (Ollama 11434, Backend 5001, Frontend 8080) ----
call :kill_port 11434 Ollama
call :kill_port 5001 Backend
call :kill_port 8080 Frontend

REM ---- Node.js ----
where node >NUL 2>&1
if errorlevel 1 (
  echo [Node] Node.js not found. Please install LTS from the official site.
  start "" "https://nodejs.org/en/download"
) else (
  for /f "delims=" %%v in ('node -v') do set NODE_VER=%%v
  echo [Node] Detected: !NODE_VER!
)

REM ---- npm ----
where npm >NUL 2>&1
if errorlevel 1 (
  echo [npm] npm not found. It normally installs with Node.js.
) else (
  for /f "delims=" %%v in ('npm -v') do set NPM_VER=%%v
  echo [npm] Detected: !NPM_VER!
)

REM ---- Frontend deps ----
if exist "%ROOT%package.json" (
  if not exist "%ROOT%node_modules" (
    echo [Frontend] Installing npm dependencies ^(first run^)...
    pushd "%ROOT%"
    call npm ci
    if errorlevel 1 (
      echo [Frontend] npm ci failed, falling back to npm install...
      call npm install
    )
    popd
  ) else (
    echo [Frontend] node_modules present.
  )
  
  REM Ensure socket.io-client is installed (for realtime notifications)
  if not exist "%ROOT%node_modules\socket.io-client\package.json" (
    echo [Frontend] Installing missing dependency: socket.io-client...
    pushd "%ROOT%"
    call npm install socket.io-client@^4.7.5 --save
    popd
  )
) else (
  echo [Frontend] package.json not found at %ROOT%
)

REM ---- Python ----
where python >NUL 2>&1
if errorlevel 1 (
  echo [Python] Python not found. Please install Python 3.10+ and add to PATH.
  start "" "https://www.python.org/downloads/"
) else (
  for /f "delims=" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
  echo [Python] Detected: !PY_VER!
)

REM ---- Backend venv & requirements ----
if exist "%PY_BACKEND%\app.py" (
  if not exist "%PY_BACKEND%\.venv\Scripts\activate.bat" (
    echo [Backend] Creating Python virtual environment...
    pushd "%PY_BACKEND%"
    python -m venv .venv
    popd
  ) else (
    echo [Backend] Virtual environment already exists.
  )
  if exist "%PY_BACKEND%\.venv\Scripts\activate.bat" (
    echo [Backend] Installing Python dependencies...
    pushd "%PY_BACKEND%"
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    if exist requirements.txt (
      python -m pip install -r requirements.txt
    ) else (
      echo [Backend] requirements.txt not found. Installing core libs...
      python -m pip install Flask Flask-Limiter bleach requests pyotp qrcode
    )
    call .venv\Scripts\deactivate.bat
    popd
  ) else (
    echo [Backend] Could not activate virtual environment. Please create it manually.
  )
) else (
  echo [Backend] app.py not found under %PY_BACKEND% ^(skipping backend setup^)
)

REM -------- Optional: start Ollama if available (disabled by default) --------
set START_OLLAMA=0
if "%START_OLLAMA%"=="1" (
  set OLLAMA_UP=
  for /f "delims=" %%S in ('powershell -NoProfile -Command "$ProgressPreference='SilentlyContinue'; try{(Invoke-WebRequest -UseBasicParsing http://localhost:11434/api/tags -TimeoutSec 2).StatusCode -eq 200}catch{ $false }"') do set OLLAMA_UP=%%S
  if /I "%OLLAMA_UP%"=="True" (
    echo [Ollama] Detected running at http://localhost:11434 - skipping start.
  ) else (
    where ollama >NUL 2>&1
    if %ERRORLEVEL%==0 (
      echo [Ollama] Launching 'ollama serve' ^(close this window to stop Ollama^)...
      start "" cmd /K ollama serve
    ) else (
      echo [Ollama] Not found in PATH. Skipping. If needed, install and add to PATH.
    )
  )
) else (
  echo [Ollama] Skipped (set START_OLLAMA=1 in this file to auto-start).
)

REM -------- Backend dependencies handled in setup above --------

REM -------- Start Python backend (port 5001) --------
if exist "%PY_BACKEND%\app.py" (
  if exist "%PY_BACKEND%\.venv\Scripts\activate.bat" (
    echo [Backend] Starting Python server with venv on http://127.0.0.1:5001 ...
start "" cmd /K "cd /D \"%PY_BACKEND%\" && call .venv\Scripts\activate.bat && python app.py"
  ) else (
    echo [Backend] Starting Python server on http://127.0.0.1:5001 ...
start "" cmd /K "cd /D \"%PY_BACKEND%\" && python app.py"
  )
) else (
  echo [Backend] app.py not found under %PY_BACKEND% ^(skipping backend start^)
)

REM -------- Frontend dependencies handled in setup above --------

REM -------- Start Vite dev server with env vars --------
set BROWSER=none
set VITE_FORCE=true

echo [Frontend] Starting Vite on http://localhost:%DEV_PORT% ...
start "" cmd /K "cd /D \"%ROOT%\" && set VITE_API_BASE=%VITE_API_BASE% && set VITE_AUTH_API_BASE=%VITE_AUTH_API_BASE% && set VITE_AUTH_REQUEST_RESET_PATH=%VITE_AUTH_REQUEST_RESET_PATH% && set VITE_AUTH_VERIFY_CODE_PATH=%VITE_AUTH_VERIFY_CODE_PATH% && set VITE_AUTH_RESET_PASSWORD_PATH=%VITE_AUTH_RESET_PASSWORD_PATH% && set VITE_AI_API_BASE=%VITE_AI_API_BASE% && set VITE_AI_CHAT_PATH=%VITE_AI_CHAT_PATH% && set VITE_AI_HEALTH_PATH=%VITE_AI_HEALTH_PATH% && npm run dev -- --port %DEV_PORT%"

REM -------- Open browser --------
start "" "http://localhost:%DEV_PORT%"

echo.
echo All services started ^(if available^):
echo  - Python backend: http://localhost:5000
echo  - Frontend:       http://localhost:%DEV_PORT%
echo  - Ollama API:     %VITE_AI_API_BASE%
echo.
echo To stop: close the opened terminal windows.
echo.
echo This launcher window will stay open so you can see any errors. Press any key to exit it.
pause

:kill_port
set KP_PORT=%~1
set KP_NAME=%~2
for /f "delims=" %%P in ('powershell -NoProfile -Command "$ErrorActionPreference='SilentlyContinue'; $p=(Get-NetTCPConnection -State Listen -LocalPort %KP_PORT% -ErrorAction SilentlyContinue | Select-Object -Expand OwningProcess -Unique); if($p){$p}"') do (
  echo [%KP_NAME%] Port %KP_PORT% busy by PID %%P - terminating...
  powershell -NoProfile -Command "Stop-Process -Id %%P -Force -ErrorAction SilentlyContinue" >NUL 2>&1
)
exit /B 0

endlocal
