[CmdletBinding()]
param()
$ErrorActionPreference = 'SilentlyContinue'

Write-Host "[Ollama] Ensuring port 11434 is free..."
try {
  $pids = Get-NetTCPConnection -State Listen -LocalPort 11434 -ErrorAction SilentlyContinue | Select-Object -Expand OwningProcess -Unique
  if ($pids) {
    foreach ($pid in $pids) { try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {} }
    Write-Host "[Ollama] Killed process(es) on 11434: $($pids -join ', ')"
  } else {
    Write-Host "[Ollama] Port 11434 already free"
  }
} catch {}

Write-Host "[Ollama] Setting persistent host to 127.0.0.1:11434 ..."
try { setx OLLAMA_HOST "127.0.0.1:11434" | Out-Null } catch {}
$env:OLLAMA_HOST = "127.0.0.1:11434"

Write-Host "[Ollama] Starting server on 127.0.0.1:11434 ..."
Start-Process -FilePath "ollama" -ArgumentList "serve"

# Optional quick probe
Start-Sleep -Seconds 2
try {
  $r = Invoke-WebRequest -UseBasicParsing http://127.0.0.1:11434 -TimeoutSec 2
  if ($r.StatusCode -eq 200) { Write-Host "[Ollama] Running on 127.0.0.1:11434" }
} catch { Write-Host "[Ollama] Server starting..." }
