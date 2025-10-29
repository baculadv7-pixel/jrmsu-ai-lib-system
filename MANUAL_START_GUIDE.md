# 📖 MANUAL START GUIDE - STEP BY STEP

## 🎯 MANUAL RUNNING OF ALL PORTS

### STEP 1: Start MySQL Database (Port 3306)

#### Option A: Using XAMPP Control Panel
```
1. Open XAMPP Control Panel
2. Click "Start" button next to MySQL
3. Wait for status to show "Running"
```

#### Option B: Using Command Line
```powershell
# Start MySQL service
net start MySQL80

# Or if using XAMPP
"C:\xampp\mysql\bin\mysqld.exe"
```

#### Verify MySQL is Running
```powershell
# Check if port 3306 is listening
netstat -an | findstr "3306"

# Should show:
# TCP    0.0.0.0:3306           0.0.0.0:0              LISTENING
```

---

### STEP 2: Start Backend API (Port 5000)

#### Open Terminal 1
```powershell
# Navigate to backend directory
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main\python-backend"

# Activate virtual environment
.venv\Scripts\activate

# Start backend server
python app.py
```

#### Expected Output
```
✅ Library endpoints registered
✅ Library endpoints loaded
🚀 Backend running at http://localhost:5000
 * Serving Flask app 'app'
 * Debug mode: on
WARNING: This is a development server.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

#### Verify Backend is Running
```powershell
# Open new terminal
curl http://localhost:5000/api/users

# Or open in browser
http://localhost:5000/api/users
```

---

### STEP 3: Start Main System (Port 8080)

#### Open Terminal 2
```powershell
# Navigate to main system directory
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\jrmsu-wise-library-main"

# Start development server
npm run dev
```

#### Expected Output
```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### Verify Main System is Running
```
Open browser: http://localhost:8080
Should see: Login page
```

---

### STEP 4: Start Mirror Page (Port 8081)

#### Open Terminal 3
```powershell
# Navigate to mirror page directory
cd "C:\Users\provu\Desktop\Python learning files\Project library data system\Phase 2\jrmsu-ai-lib-system\mirror-login-page"

# Start development server
npm run dev
```

#### Expected Output
```
VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8081/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### Verify Mirror Page is Running
```
Open browser: http://localhost:8081
Should see: Library Entry page
```

---

### STEP 5: Start Ollama AI (Port 11434)

#### Open Terminal 4
```powershell
# Start Ollama server
ollama serve
```

#### Expected Output
```
Listening on 127.0.0.1:11434 (version 0.x.x)
```

#### Verify Ollama is Running
```powershell
# Check if running
curl http://localhost:11434/api/tags

# Or
netstat -an | findstr "11434"
```

---

## 🔧 KILL PORTS IF ALREADY IN USE

### Kill Port 5000 (Backend)
```powershell
# Find process
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess

# Kill process (replace PID with actual process ID)
Stop-Process -Id [PID] -Force

# Or use batch file
kill_ports.bat 5000
```

### Kill Port 8080 (Main System)
```powershell
Get-NetTCPConnection -LocalPort 8080 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Or
kill_ports.bat 8080
```

### Kill Port 8081 (Mirror Page)
```powershell
Get-NetTCPConnection -LocalPort 8081 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Or
kill_ports.bat 8081
```

### Kill Port 11434 (Ollama)
```powershell
Get-NetTCPConnection -LocalPort 11434 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Or
kill_ports.bat 11434
```

### Kill All Ports
```batch
kill_ports.bat all
```

---

## 📊 VERIFY ALL SYSTEMS RUNNING

### Check All Ports
```powershell
netstat -an | findstr "3306 5000 8080 8081 11434"
```

### Expected Output
```
TCP    0.0.0.0:3306           0.0.0.0:0              LISTENING
TCP    127.0.0.1:5000         0.0.0.0:0              LISTENING
TCP    127.0.0.1:8080         0.0.0.0:0              LISTENING
TCP    127.0.0.1:8081         0.0.0.0:0              LISTENING
TCP    127.0.0.1:11434        0.0.0.0:0              LISTENING
```

### Test Each System
```
✅ MySQL:        http://localhost:3306 (use MySQL client)
✅ Backend:      http://localhost:5000/api/users
✅ Main System:  http://localhost:8080
✅ Mirror Page:  http://localhost:8081
✅ Ollama:       http://localhost:11434/api/tags
```

---

## 🎯 TERMINAL LAYOUT

```
┌─────────────────────────────────────────────────────────┐
│  Terminal 1: Backend API (Port 5000)                    │
│  python-backend> .venv\Scripts\activate                 │
│  python-backend> python app.py                          │
├─────────────────────────────────────────────────────────┤
│  Terminal 2: Main System (Port 8080)                    │
│  jrmsu-wise-library-main> npm run dev                   │
├─────────────────────────────────────────────────────────┤
│  Terminal 3: Mirror Page (Port 8081)                    │
│  mirror-login-page> npm run dev                         │
├─────────────────────────────────────────────────────────┤
│  Terminal 4: Ollama AI (Port 11434)                     │
│  > ollama serve                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 RESTART A SINGLE SERVICE

### Restart Backend
```powershell
# In Terminal 1, press Ctrl+C to stop
# Then run again:
python app.py
```

### Restart Main System
```powershell
# In Terminal 2, press Ctrl+C to stop
# Then run again:
npm run dev
```

### Restart Mirror Page
```powershell
# In Terminal 3, press Ctrl+C to stop
# Then run again:
npm run dev
```

### Restart Ollama
```powershell
# In Terminal 4, press Ctrl+C to stop
# Then run again:
ollama serve
```

---

## 📝 QUICK REFERENCE

### Start Order
```
1. MySQL (3306)      - Start first
2. Backend (5000)    - Start second
3. Main System (8080) - Start third
4. Mirror Page (8081) - Start fourth
5. Ollama (11434)    - Start last (optional)
```

### Stop Order
```
1. Mirror Page (8081) - Stop first
2. Main System (8080) - Stop second
3. Backend (5000)     - Stop third
4. Ollama (11434)     - Stop fourth
5. MySQL (3306)       - Stop last
```

### URLs
```
Backend:      http://localhost:5000
Main System:  http://localhost:8080
Mirror Page:  http://localhost:8081
Ollama:       http://localhost:11434
```

---

## ✅ SUCCESS INDICATORS

### Backend Running
```
✅ Library endpoints registered
✅ Library endpoints loaded
🚀 Backend running at http://localhost:5000
```

### Main System Running
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:8080/
```

### Mirror Page Running
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:8081/
```

### Ollama Running
```
Listening on 127.0.0.1:11434
```

---

**Last Updated:** Oct 29, 2025 1:52 PM  
**Status:** ✅ Complete Manual Guide
