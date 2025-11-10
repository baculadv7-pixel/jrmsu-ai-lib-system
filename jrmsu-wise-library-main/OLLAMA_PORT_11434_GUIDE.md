Perfect — here’s your **complete step-by-step instruction** to **force Ollama to always use its main default port (`127.0.0.1:11434`)** and ensure your **JRMSU AI Library System** (frontend + backend + AI) connects properly.

This guide locks the Ollama service to port `11434` **permanently** and ensures your Flask backend (port `5000`) and frontend (port `8080`) communicate with it seamlessly.

---

# ⚙️ FULL INSTRUCTION — FORCE OLLAMA TO USE MAIN PORT (127.0.0.1:11434)

---

## 🧩 1. VERIFY AND CLOSE ANY RUNNING OLLAMA INSTANCE

Before forcing the main port, close any existing process using it.

### 🧠 Steps:

1. Open **PowerShell** as Administrator.
2. Run this command:

   ```powershell
   netstat -ano | findstr :11434
   ```

   This will list any process using port 11434.
   Example output:

   ```
   TCP    127.0.0.1:11434     0.0.0.0:0     LISTENING     14560
   ```
3. Copy the **Process ID (PID)** (e.g., `14560`).
4. Kill that process:

   ```powershell
   taskkill /PID 14560 /F
   ```

   *(Replace 14560 with your own PID)*

✅ **Result:** Port `11434` is now free and ready for Ollama.

---

## 🧱 2. SET OLLAMA HOST AND PORT PERMANENTLY

You will now lock Ollama’s API endpoint to **`127.0.0.1:11434`**.

### 🧠 Steps:

1. Run this command in PowerShell:

   ```powershell
   setx OLLAMA_HOST "127.0.0.1:11434"
   ```

   This creates a persistent environment variable that forces Ollama to always bind to that address and port.

2. Restart PowerShell (important — environment variable loads only on restart).

3. Now start Ollama:

   ```powershell
   ollama serve
   ```

✅ **Expected Output:**

```
INFO  [main] starting ollama server on 127.0.0.1:11434
```

---

## 🔗 3. TEST OLLAMA CONNECTION

1. Open a browser and go to:

   ```
   http://127.0.0.1:11434
   ```

   You should see:

   ```
   Ollama is running
   ```
2. Optional: Check the API:

   ```powershell
   curl http://127.0.0.1:11434/api/tags
   ```

   You should see your models (e.g., `llama3:8b-instruct-q4_K_M`).

---

## 🧠 4. CONNECT OLLAMA TO YOUR BACKEND (PORT 5000)

Ensure the backend Flask app correctly references this port.

### 🧩 Backend Settings (Python)

Your Flask `app.py` or `ollama_service.py` should use:

```python
OLLAMA_URL = "http://127.0.0.1:11434"
```

and connect using:

```python
response = requests.post(f"{OLLAMA_URL}/api/generate", json={"model": "llama3:8b-instruct-q4_K_M", "prompt": message})
```

✅ **Verification:**
When you run:

```powershell
python app.py
```

You should see:

```
Connected to Ollama at http://127.0.0.1:11434
Backend running on http://127.0.0.1:5000
```

---

## 🌐 5. ENSURE FRONTEND CONNECTS TO BACKEND (PORT 8080 → 5000)

### 🧩 Frontend Configuration

In your **frontend environment file** (e.g., `.env` or `vite.config.js`):

```
VITE_API_BASE_URL=http://127.0.0.1:5000
```

Then rebuild the frontend:

```powershell
npm run dev
```

✅ **Result:**
Frontend: `http://localhost:8080`
Backend:  `http://127.0.0.1:5000`
Ollama:   `http://127.0.0.1:11434`

All services now aligned and synced.

---

## 🧰 6. OPTIONAL — AUTO START SCRIPT (FOR CONVENIENCE)

You can make a batch file to start everything correctly each time.

### 🧩 Create file:

`run-all.bat`

```bat
@echo off
title JRMSU AI Library System - Auto Start
echo Starting Ollama on 127.0.0.1:11434...
start ollama serve
timeout /t 3
cd python-backend
echo Activating Python backend...
call .venv\Scripts\activate
start python app.py
timeout /t 3
cd ..
echo Starting frontend on http://localhost:8080...
npm run dev
pause
```

✅ **Usage:**
Double-click `run-all.bat` — it launches Ollama, backend, and frontend in sequence.

---

## 🧩 7. VERIFY SYSTEM COMMUNICATION

Once all are running:

| Component          | Port  | Test URL                                                           |
| ------------------ | ----- | ------------------------------------------------------------------ |
| Ollama (AI Engine) | 11434 | [http://127.0.0.1:11434/api/tags](http://127.0.0.1:11434/api/tags) |
| Flask Backend      | 5000  | [http://127.0.0.1:5000/health](http://127.0.0.1:5000/health)       |
| Vite Frontend      | 8080  | [http://localhost:8080](http://localhost:8080)                     |

If the AI assistant “Jose” replies to messages → connection is confirmed ✅

---

## ⚙️ 8. TROUBLESHOOTING

| Issue                                                      | Cause                                              | Fix                                                                               |                                                |
| ---------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------- |
| `Error: listen tcp 127.0.0.1:11434: bind: Only one usage…` | Another Ollama instance or service using that port | Run `netstat -ano                                                                 | findstr :11434`, then `taskkill /PID <PID> /F` |
| `Connection refused (frontend)`                            | Backend not running or wrong URL                   | Verify backend at [http://127.0.0.1:5000](http://127.0.0.1:5000)                  |                                                |
| `Flask rate limit warning`                                 | Non-critical warning                               | Ignore for development; production should use Redis or Memcached storage backend. |                                                |

---

## ✅ Final State Overview

| Component        | Status                 | Port      | Persistent              |
| ---------------- | ---------------------- | --------- | ----------------------- |
| Ollama AI Server | 🟢 Running             | **11434** | Yes (forced via `setx`) |
| Flask Backend    | 🟢 Running             | **5000**  | Yes                     |
| Vite Frontend    | 🟢 Running             | **8080**  | Yes                     |
| AI Integration   | 🧠 Connected to Ollama | Real-time | Global sync active      |

---

Would you like me to also include a **one-command PowerShell launcher script** that kills duplicate Ollama instances *automatically* before serving on `11434`?
That prevents the “Only one usage of each socket address” error permanently.
