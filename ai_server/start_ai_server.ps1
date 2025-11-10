param(
  [switch]$NoVenv
)

# Ensure we are in this script's directory
Set-Location -LiteralPath (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Activate venv if available
if(-not $NoVenv){
  $venv = Join-Path (Get-Location) ".venv\\Scripts\\Activate.ps1"
  if(Test-Path $venv){
    . $venv
  }
}

# Ensure Ollama port is fixed (11434); do not change
$ollamaPort = 11434
$aiPort = 5002

function Test-PortListening($port){
  try {
    $conn = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    return $null -ne $conn
  } catch { return $false }
}

# (Optional) Start Ollama if not listening
if(-not (Test-PortListening $ollamaPort)){
  Write-Host "Ollama not listening on :$ollamaPort; attempting to start 'ollama serve'..."
  try {
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 2
  } catch {
    Write-Warning "Could not start 'ollama serve'. Ensure Ollama is installed and running on port $ollamaPort."
  }
}

# Start AI server; it will gracefully ask any existing instance on 5002 to quit
Write-Host "Starting AI server on port $aiPort (singleton enforced)..."
$env:FLASK_ENV = "production"
$env:PYTHONUNBUFFERED = "1"

python app.py
