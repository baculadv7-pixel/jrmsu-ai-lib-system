[CmdletBinding()]
param()
$ErrorActionPreference = 'SilentlyContinue'

# Paths
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root 'python-backend'

# Kill conflicting ports
foreach ($port in 11434,5000,8080) {
  try {
    $pids = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -Expand OwningProcess -Unique
    if ($pids) { foreach ($pid in $pids) { try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {} } }
  } catch {}
}

# Start Ollama at 11434
try { setx OLLAMA_HOST "127.0.0.1:11434" | Out-Null } catch {}
$env:OLLAMA_HOST = "127.0.0.1:11434"
Start-Process -FilePath 'ollama' -ArgumentList 'serve'

Start-Sleep -Seconds 2

# Start Backend (5000)
$pyExe = Join-Path $backend '.venv\Scripts\python.exe'
if (Test-Path $pyExe) {
  Start-Process -FilePath $pyExe -ArgumentList 'app.py' -WorkingDirectory $backend
} else {
  Start-Process -FilePath 'python' -ArgumentList 'app.py' -WorkingDirectory $backend
}

# Start Frontend (8080)
Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','dev','--','--port','8080') -WorkingDirectory $root

# Open browser
Start-Process 'http://localhost:8080'
