# 🚀 START ALL SYSTEMS - COMPLETE GUIDE

## 📋 SYSTEMS OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│  System Architecture                                    │
├─────────────────────────────────────────────────────────┤
│  1. MySQL Database      → localhost:3306                │
│  2. Backend API         → localhost:5000                │
│  3. Main System         → localhost:8080                │
│  4. Mirror Page         → localhost:8081                │
│  5. Ollama AI           → localhost:11434               │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 SYSTEM 1: MySQL DATABASE

### Start MySQL Server
```powershell
# Option A: If using XAMPP
# Open XAMPP Control Panel
# Click "Start" on MySQL

# Option B: If using standalone MySQL
net start MySQL80

# Option C: If using MySQL Workbench
# Open MySQL Workbench
# Connect to local instance
```

### Verify MySQL is Running
```powershell
# Test connection
mysql -u root -p

# Or check if port 3306 is listening
netstat -an | findstr "3306"
```

**Expected Output:**
```
TCP    0.0.0.0:3306           0.0.0.0:0              LISTENING
```

---

## 🔧 SYSTEM 2: BACKEND API (Port 5000)

### Location
```
C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\python-backend
```

### Start Backend
```powershell
# Navigate to backend directory
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\python-backend"

# Activate virtual environment
.venv\Scripts\activate

# Start backend server
python app.py
```

### Expected Output
```
✅ Library endpoints registered
✅ Library endpoints loaded
🚀 Backend running at http://localhost:5000
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server. Do not use it in a production deployment.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

### Verify Backend is Running
```powershell
# Open new terminal and test
curl http://localhost:5000/api/users

# Or open in browser
# http://localhost:5000/api/users
```

---

## 🔧 SYSTEM 3: MAIN SYSTEM (Port 8080)

### Location
```
C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main
```

### Start Main System
```powershell
# Navigate to main system directory
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main"

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

### Expected Output
```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Verify Main System is Running
```
Open browser: http://localhost:8080
```

---

## 🔧 SYSTEM 4: MIRROR PAGE (Port 8081)

### Location
```
C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\mirror-login-page
```

### Start Mirror Page
```powershell
# Navigate to mirror page directory
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\mirror-login-page"

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

### Expected Output
```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8081/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Verify Mirror Page is Running
```
Open browser: http://localhost:8081
```

---

## 🔧 SYSTEM 5: OLLAMA AI (Port 11434)

### Configuration
**File:** `jrmsu-wise-library-main/python-backend/.env`
```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b-instruct-q4_K_M
```

### Start Ollama
```powershell
# Option A: If Ollama is installed as service
# It should start automatically

# Option B: Start Ollama manually
ollama serve
```

### Expected Output
```
Listening on 127.0.0.1:11434 (version 0.x.x)
```

### Verify Ollama is Running
```powershell
# Test Ollama API
curl http://localhost:11434/api/tags

# Or check if port 11434 is listening
netstat -an | findstr "11434"
```

**Expected Output:**
```
TCP    127.0.0.1:11434        0.0.0.0:0              LISTENING
```

### Pull Required Model (First Time Only)
```powershell
# Pull the model specified in .env
ollama pull llama3:8b-instruct-q4_K_M

# Or use a different model
ollama pull llama3
```

### Test AI Chat
```powershell
# Test via backend API
curl -X POST http://localhost:5000/ai/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"Hello\",\"context\":\"test\"}"
```

---

## 📝 COMPLETE STARTUP SCRIPT

### Create a PowerShell Script
**File:** `START_ALL.ps1`

```powershell
# START_ALL.ps1 - Start all JRMSU Library Systems

Write-Host "🚀 Starting JRMSU Library System..." -ForegroundColor Green
Write-Host ""

# Check if MySQL is running
Write-Host "1️⃣ Checking MySQL..." -ForegroundColor Cyan
$mysqlRunning = Get-Process mysqld -ErrorAction SilentlyContinue
if ($mysqlRunning) {
    Write-Host "   ✅ MySQL is running" -ForegroundColor Green
} else {
    Write-Host "   ❌ MySQL is not running. Please start MySQL first!" -ForegroundColor Red
    exit
}

# Start Backend
Write-Host ""
Write-Host "2️⃣ Starting Backend API (Port 5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\python-backend'; .venv\Scripts\activate; python app.py"
Start-Sleep -Seconds 3

# Start Main System
Write-Host ""
Write-Host "3️⃣ Starting Main System (Port 8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main'; npm run dev"
Start-Sleep -Seconds 3

# Start Mirror Page
Write-Host ""
Write-Host "4️⃣ Starting Mirror Page (Port 8081)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\mirror-login-page'; npm run dev"
Start-Sleep -Seconds 3

# Check Ollama
Write-Host ""
Write-Host "5️⃣ Checking Ollama AI (Port 11434)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✅ Ollama is running" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Ollama is not running. Start it with: ollama serve" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ All systems started!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor Cyan
Write-Host "   Backend:      http://localhost:5000" -ForegroundColor White
Write-Host "   Main System:  http://localhost:8080" -ForegroundColor White
Write-Host "   Mirror Page:  http://localhost:8081" -ForegroundColor White
Write-Host "   Ollama AI:    http://localhost:11434" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
```

### Run the Script
```powershell
# Navigate to project root
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system"

# Run the startup script
.\START_ALL.ps1
```

---

## 🧪 VERIFICATION CHECKLIST

### After Starting All Systems:

#### 1. MySQL Database ✅
```powershell
netstat -an | findstr "3306"
# Should show: LISTENING
```

#### 2. Backend API ✅
```powershell
curl http://localhost:5000/api/users
# Should return JSON data
```

#### 3. Main System ✅
```
Open: http://localhost:8080
Should see: Login page
```

#### 4. Mirror Page ✅
```
Open: http://localhost:8081
Should see: Library Entry page
```

#### 5. Ollama AI ✅
```powershell
curl http://localhost:11434/api/tags
# Should return list of models
```

---

## 🔍 TROUBLESHOOTING

### Port Already in Use

**Error:** `Port 5000 is already in use`

**Solution:**
```powershell
# Find process using port 5000
netstat -ano | findstr "5000"

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Backend Won't Start

**Error:** `ModuleNotFoundError`

**Solution:**
```powershell
# Reinstall dependencies
cd "jrmsu-wise-library-main\python-backend"
.venv\Scripts\activate
pip install -r requirements.txt
```

### Ollama Not Found

**Error:** `ollama: command not found`

**Solution:**
```powershell
# Install Ollama
# Download from: https://ollama.ai/download

# Or use winget
winget install Ollama.Ollama
```

### MySQL Connection Failed

**Error:** `Can't connect to MySQL server`

**Solution:**
```powershell
# Check MySQL service
net start MySQL80

# Or restart MySQL
net stop MySQL80
net start MySQL80
```

---

## 📊 SYSTEM STATUS DASHBOARD

### Quick Status Check
```powershell
# Check all ports
netstat -an | findstr "3306 5000 8080 8081 11434"
```

**Expected Output:**
```
TCP    0.0.0.0:3306           LISTENING    # MySQL
TCP    127.0.0.1:5000         LISTENING    # Backend
TCP    127.0.0.1:8080         LISTENING    # Main System
TCP    127.0.0.1:8081         LISTENING    # Mirror Page
TCP    127.0.0.1:11434        LISTENING    # Ollama
```

---

## 🎯 RECOMMENDED STARTUP ORDER

1. **MySQL Database** (Port 3306) - Start first
2. **Ollama AI** (Port 11434) - Start second
3. **Backend API** (Port 5000) - Start third
4. **Main System** (Port 8080) - Start fourth
5. **Mirror Page** (Port 8081) - Start last

---

## 📝 ENVIRONMENT VARIABLES

### Backend .env File
**Location:** `jrmsu-wise-library-main/python-backend/.env`

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=jrmsu_library
DB_USER=root
DB_PASSWORD=

# Server Configuration
FLASK_PORT=5000
FLASK_DEBUG=True

# Ollama AI Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b-instruct-q4_K_M

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:8081
```

---

## ✅ SUCCESS INDICATORS

### All Systems Running Successfully:

```
✅ MySQL:        Port 3306 listening
✅ Backend:      http://localhost:5000 responding
✅ Main System:  http://localhost:8080 loaded
✅ Mirror Page:  http://localhost:8081 loaded
✅ Ollama AI:    http://localhost:11434 responding
```

---

## 🚀 QUICK START (Copy-Paste)

```powershell
# Terminal 1: Backend
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\python-backend"
.venv\Scripts\activate
python app.py

# Terminal 2: Main System
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main"
npm run dev

# Terminal 3: Mirror Page
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\mirror-login-page"
npm run dev

# Terminal 4: Ollama (if not running)
ollama serve
```

---

**Last Updated:** Oct 29, 2025 1:35 PM  
**Status:** ✅ Complete Startup Guide  
**Ollama Port:** 11434 (Configured in .env)
