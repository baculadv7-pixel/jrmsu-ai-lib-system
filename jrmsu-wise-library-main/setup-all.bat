@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ==============================================
REM JRMSU AI Library System - Environment Setup
REM Checks and installs core dependencies for Windows dev
REM - Node.js + npm packages
REM - Python + virtual environment + backend requirements
REM - Ollama + llama3:8b-instruct-q4_K_M model (optional)
REM ==============================================

set ROOT=%~dp0
set PY_BACKEND=%ROOT%python-backend

echo.
echo [Setup] Starting environment checks...

REM -------- Check Node.js --------
where node >NUL 2>&1
if errorlevel 1 (
  echo [Node] Node.js not found.
  echo [Node] Please install Node.js LTS from the official site.
  start "" "https://nodejs.org/en/download"
) else (
  for /f "delims=" %%v in ('node -v') do set NODE_VER=%%v
  echo [Node] Node.js detected: !NODE_VER!
)

REM -------- Check npm --------
where npm >NUL 2>&1
if errorlevel 1 (
  echo [npm] npm not found. It normally installs with Node.js.
  echo [npm] After installing Node.js, re-run this setup.
) else (
  for /f "delims=" %%v in ('npm -v') do set NPM_VER=%%v
  echo [npm] npm detected: !NPM_VER!
)

REM -------- Install frontend dependencies --------
if exist "%ROOT%package.json" (
  if not exist "%ROOT%node_modules" (
    echo [Frontend] Installing npm dependencies (first run)...
    pushd "%ROOT%"
    call npm ci
    if errorlevel 1 (
      echo [Frontend] npm ci failed, falling back to npm install...
      call npm install
    )
    popd
  ) else (
    echo [Frontend] node_modules present. You can update with "npm ci" later if needed.
  )
) else (
  echo [Frontend] package.json not found at %ROOT%
)

REM -------- Check Python --------
where python >NUL 2>&1
if errorlevel 1 (
  echo [Python] Python not found.
  echo [Python] Please install Python 3.10+ and add to PATH.
  start "" "https://www.python.org/downloads/"
) else (
  for /f "delims=" %%v in ('python --version 2^>^&1') do set PY_VER=%%v
  echo [Python] Detected: !PY_VER!
)

REM -------- Create venv if missing --------
if exist "%PY_BACKEND%\app.py" (
  if not exist "%PY_BACKEND%\.venv\Scripts\activate.bat" (
    echo [Backend] Creating Python virtual environment...
    pushd "%PY_BACKEND%"
    python -m venv .venv
    popd
  ) else (
    echo [Backend] Virtual environment already exists.
  )

  REM -------- Install backend requirements --------
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

REM -------- Check Ollama (optional) --------
where ollama >NUL 2>&1
if errorlevel 1 (
  echo [Ollama] Ollama not found in PATH. If you want local AI, install from:
  echo          https://ollama.com/download
) else (
  echo [Ollama] Ollama detected. Checking model availability...
  for /f "delims=" %%v in ('ollama list ^| findstr /I "llama3:8b-instruct-q4_K_M"') do set OLMODEL=%%v
  if not defined OLMODEL (
    echo [Ollama] Model "llama3:8b-instruct-q4_K_M" not found locally.
    choice /M "Pull the model now? (downloads ~5GB)"
    if errorlevel 2 (
      echo [Ollama] Skipping model pull.
    ) else (
      echo [Ollama] Pulling model in a new window...
      start "Ollama Pull" cmd /K ollama pull llama3:8b-instruct-q4_K_M
    )
  ) else (
    echo [Ollama] Model present.
  )
)

echo.
echo [Setup] Environment check and installation completed.
echo You can now run "run-all.bat" to start the app.
pause

endlocal
