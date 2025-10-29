# 🔴 KILL PORTS GUIDE

## ✅ PORT 8081 KILLED!

**Process ID 15900 has been terminated.**

Port 8081 is now free and you can start the mirror page again.

---

## 🚀 QUICK COMMANDS

### Kill Specific Port
```batch
kill_ports.bat 8081    # Kill port 8081
kill_ports.bat 8080    # Kill port 8080
kill_ports.bat 5000    # Kill port 5000
kill_ports.bat 11434   # Kill port 11434
```

### Kill All Ports
```batch
kill_ports.bat all     # Kill all system ports
```

### Interactive Mode
```batch
kill_ports.bat         # Shows menu to choose
```

---

## 📋 AVAILABLE COMMANDS

### PowerShell Commands

#### Kill Port 8081
```powershell
Get-NetTCPConnection -LocalPort 8081 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

#### Kill Port 8080
```powershell
Get-NetTCPConnection -LocalPort 8080 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

#### Kill Port 5000
```powershell
Get-NetTCPConnection -LocalPort 5000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

#### Kill Port 11434
```powershell
Get-NetTCPConnection -LocalPort 11434 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

#### Check What's Using a Port
```powershell
Get-NetTCPConnection -LocalPort 8081 | Select-Object LocalPort, OwningProcess, State
```

---

## 🎯 BATCH FILE USAGE

### kill_ports.bat

**Interactive Menu:**
```batch
kill_ports.bat
```

**Output:**
```
============================================================
  KILL PORTS - JRMSU LIBRARY SYSTEM
============================================================

Current ports in use:

LocalPort OwningProcess State
--------- ------------- -----
     5000         12345 Listen
     8080         23456 Listen
     8081         34567 Listen
    11434         45678 Listen

What would you like to do?
  1. Kill port 5000 (Backend)
  2. Kill port 8080 (Main System)
  3. Kill port 8081 (Mirror Page)
  4. Kill port 11434 (Ollama)
  5. Kill ALL ports
  6. Exit

Enter choice (1-6):
```

**Direct Command:**
```batch
kill_ports.bat 8081
```

**Output:**
```
Killing Mirror Page (Port 8081)...
[OK] Port 8081 freed
```

**Kill All:**
```batch
kill_ports.bat all
```

**Output:**
```
Killing ALL system ports...

[1/4] Killing Backend API (Port 5000)...
      [OK] Port 5000 freed
[2/4] Killing Main System (Port 8080)...
      [OK] Port 8080 freed
[3/4] Killing Mirror Page (Port 8081)...
      [OK] Port 8081 freed
[4/4] Killing Ollama AI (Port 11434)...
      [OK] Port 11434 freed

============================================================
  ALL PORTS FREED!
============================================================
```

---

## 🔧 TROUBLESHOOTING

### Port Still in Use After Killing

**Solution 1: Wait a few seconds**
```
Sometimes it takes 2-5 seconds for the port to be released
```

**Solution 2: Kill again**
```batch
kill_ports.bat 8081
```

**Solution 3: Restart the service**
```batch
kill_ports.bat all
run_all_servers.bat
```

### Can't Find Process

**Check if port is actually in use:**
```powershell
Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
```

**If no output, port is free!**

### Access Denied

**Run as Administrator:**
```
Right-click kill_ports.bat
Select "Run as administrator"
```

---

## 📊 COMMON SCENARIOS

### Scenario 1: Mirror Page Won't Start
```
Error: Port 8081 is already in use

Solution:
kill_ports.bat 8081
cd mirror-login-page
npm run dev
```

### Scenario 2: Backend Won't Start
```
Error: Port 5000 is already in use

Solution:
kill_ports.bat 5000
cd jrmsu-wise-library-main\python-backend
.venv\Scripts\activate
python app.py
```

### Scenario 3: Main System Won't Start
```
Error: Port 8080 is already in use

Solution:
kill_ports.bat 8080
cd jrmsu-wise-library-main
npm run dev
```

### Scenario 4: Restart Everything
```
Solution:
kill_ports.bat all
run_all_servers.bat
```

---

## 🎯 QUICK REFERENCE

### Kill Single Port
```batch
kill_ports.bat [port]
```

### Kill All Ports
```batch
kill_ports.bat all
```

### Check Ports
```batch
kill_ports.bat
# Then press 6 to exit
```

### Restart System
```batch
stop_all_servers.bat    # or kill_ports.bat all
run_all_servers.bat
```

---

## 📝 PORT ASSIGNMENTS

```
┌─────────────────────────────────────────┐
│  Service         │  Port   │  Protocol  │
├─────────────────────────────────────────┤
│  Backend API     │  5000   │  HTTP      │
│  Main System     │  8080   │  HTTP      │
│  Mirror Page     │  8081   │  HTTP      │
│  Ollama AI       │  11434  │  HTTP      │
│  MySQL Database  │  3306   │  TCP       │
└─────────────────────────────────────────┘
```

---

## ✅ NOW YOU CAN START MIRROR PAGE

```powershell
cd mirror-login-page
npm run dev
```

**Port 8081 is now free!** ✅

---

**Last Updated:** Oct 29, 2025 1:50 PM  
**Status:** ✅ Port 8081 Killed Successfully  
**Tool:** kill_ports.bat created
