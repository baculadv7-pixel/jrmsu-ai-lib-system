# 🚀 BATCH FILES GUIDE - START ALL SERVERS

## 📋 AVAILABLE BATCH FILES

```
┌─────────────────────────────────────────────────────────┐
│  File                        │  Description             │
├─────────────────────────────────────────────────────────┤
│  run_all_servers.bat         │  Full version with checks│
│  run_all_servers_simple.bat  │  Quick start (no checks) │
│  stop_all_servers.bat        │  Stop all servers        │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 QUICK START (EASIEST WAY)

### Option 1: Full Version (Recommended)
```batch
Double-click: run_all_servers.bat
```

**Features:**
- ✅ Checks MySQL is running
- ✅ Checks Node.js and Python installed
- ✅ Checks if ports are available
- ✅ Checks Ollama AI status
- ✅ Starts all servers with colored terminals
- ✅ Opens browsers automatically

### Option 2: Simple Version (Fast)
```batch
Double-click: run_all_servers_simple.bat
```

**Features:**
- ✅ Quick start without checks
- ✅ Just starts all servers
- ✅ Minimal output

### Option 3: Stop All Servers
```batch
Double-click: stop_all_servers.bat
```

**Features:**
- ✅ Stops all running servers
- ✅ Kills processes on ports 5000, 8080, 8081, 11434
- ✅ Cleans up Node.js and Python processes

---

## 📊 WHAT GETS STARTED

### 1. Backend API (Port 5000)
```
Location: jrmsu-wise-library-main\python-backend
Command:  .venv\Scripts\activate && python app.py
Color:    Blue terminal
```

### 2. Main System (Port 8080)
```
Location: jrmsu-wise-library-main
Command:  npm run dev
Color:    Yellow terminal
```

### 3. Mirror Page (Port 8081)
```
Location: mirror-login-page
Command:  npm run dev
Color:    Purple terminal
```

### 4. Ollama AI (Port 11434)
```
Command:  ollama serve
Color:    Red terminal
```

---

## 🔧 FULL VERSION DETAILS

### run_all_servers.bat

**What it does:**

#### 1. Prerequisites Check
```
✅ MySQL Database (Port 3306)
✅ Node.js installed
✅ Python installed
✅ Ports availability (5000, 8080, 8081)
✅ Ollama AI status (Port 11434)
```

#### 2. Start Services
```
[1/4] Backend API (Port 5000)
[2/4] Main System (Port 8080)
[3/4] Mirror Page (Port 8081)
[4/4] Ollama AI (Port 11434)
```

#### 3. Open Browsers
```
Opens: http://localhost:8080 (Main System)
Opens: http://localhost:8081 (Mirror Page)
```

### Expected Output
```
============================================================
  JRMSU AI LIBRARY SYSTEM - STARTUP MANAGER
============================================================

============================================================
  CHECKING PREREQUISITES
============================================================

[1/5] Checking MySQL Database (Port 3306)...
      [OK] MySQL is running on port 3306
[2/5] Checking Node.js...
      [OK] Node.js is installed
[3/5] Checking Python...
      [OK] Python is installed
[4/5] Checking if ports are available...
      [OK] Port 5000 is available
      [OK] Port 8080 is available
      [OK] Port 8081 is available
[5/5] Checking Ollama AI (Port 11434)...
      [OK] Ollama is running on port 11434

============================================================
  STARTING SERVICES
============================================================

[1/4] Starting Backend API (Port 5000)...
      [OK] Backend API starting...
[2/4] Starting Main System (Port 8080)...
      [OK] Main System starting...
[3/4] Starting Mirror Page (Port 8081)...
      [OK] Mirror Page starting...
[4/4] Checking Ollama AI (Port 11434)...
      [OK] Ollama is already running

============================================================
  ALL SERVICES STARTED!
============================================================

  SYSTEM URLS:
  ============================================================
  Backend API:     http://localhost:5000
  Main System:     http://localhost:8080
  Mirror Page:     http://localhost:8081
  Ollama AI:       http://localhost:11434
  ============================================================
```

---

## 🚀 SIMPLE VERSION DETAILS

### run_all_servers_simple.bat

**What it does:**
- Starts all servers immediately
- No prerequisite checks
- Minimal output
- Fast startup

**Use when:**
- You know everything is installed
- You want quick startup
- You don't need detailed output

---

## 🛑 STOP ALL SERVERS

### stop_all_servers.bat

**What it does:**

#### 1. Kill Processes by Port
```
[1/4] Stopping Backend API (Port 5000)
[2/4] Stopping Main System (Port 8080)
[3/4] Stopping Mirror Page (Port 8081)
[4/4] Stopping Ollama AI (Port 11434)
```

#### 2. Clean Up
```
Kills remaining Node.js processes
Kills remaining Python processes
```

### Expected Output
```
============================================================
  STOPPING ALL JRMSU LIBRARY SYSTEM SERVERS
============================================================

[1/4] Stopping Backend API (Port 5000)...
      [OK] Backend stopped
[2/4] Stopping Main System (Port 8080)...
      [OK] Main System stopped
[3/4] Stopping Mirror Page (Port 8081)...
      [OK] Mirror Page stopped
[4/4] Stopping Ollama AI (Port 11434)...
      [OK] Ollama AI stopped

============================================================
  ALL SERVERS STOPPED!
============================================================
```

---

## 🔍 TROUBLESHOOTING

### Error: MySQL is not running
```
Solution:
1. Open XAMPP Control Panel
2. Click "Start" on MySQL
OR
3. Run: net start MySQL80
```

### Error: Port already in use
```
Solution:
1. Run: stop_all_servers.bat
2. Wait 5 seconds
3. Run: run_all_servers.bat again
```

### Error: Virtual environment not found
```
Solution:
cd jrmsu-wise-library-main\python-backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Error: package.json not found
```
Solution:
cd jrmsu-wise-library-main
npm install

cd mirror-login-page
npm install
```

### Warning: Ollama not installed
```
Solution:
1. Download from: https://ollama.ai/download
2. Install Ollama
3. Run: ollama serve
4. Run: ollama pull llama3:8b-instruct-q4_K_M
```

---

## 📝 TERMINAL COLORS

Each service opens in a different colored terminal for easy identification:

```
Backend API:    Blue (0B)
Main System:    Yellow (0E)
Mirror Page:    Purple (0D)
Ollama AI:      Red (0C)
```

---

## 🎯 RECOMMENDED WORKFLOW

### Starting Work
```
1. Double-click: run_all_servers.bat
2. Wait 10-15 seconds
3. Browsers open automatically
4. Start working!
```

### During Work
```
- Keep terminal windows open
- Check terminals for errors
- Use Ctrl+C in a terminal to restart that service
```

### Ending Work
```
1. Double-click: stop_all_servers.bat
2. All services stop
3. Close terminal windows
```

---

## ✅ VERIFICATION

### Check if all servers are running:
```batch
netstat -an | findstr "5000 8080 8081 11434"
```

**Expected Output:**
```
TCP    127.0.0.1:5000         LISTENING
TCP    127.0.0.1:8080         LISTENING
TCP    127.0.0.1:8081         LISTENING
TCP    127.0.0.1:11434        LISTENING
```

---

## 🎉 QUICK REFERENCE

### Start All Servers
```
run_all_servers.bat          (Full version)
run_all_servers_simple.bat   (Quick version)
```

### Stop All Servers
```
stop_all_servers.bat
```

### URLs
```
Backend:      http://localhost:5000
Main System:  http://localhost:8080
Mirror Page:  http://localhost:8081
Ollama AI:    http://localhost:11434
```

### Architecture
```
Main System (8080)  ──┐
                      ├──> Backend API (5000) ──> MySQL (3306)
Mirror Page (8081)  ──┘
                      └──> Ollama AI (11434)
```

---

**Last Updated:** Oct 29, 2025 1:45 PM  
**Status:** ✅ Complete Batch Files Ready  
**Files:** 3 batch files + guide
