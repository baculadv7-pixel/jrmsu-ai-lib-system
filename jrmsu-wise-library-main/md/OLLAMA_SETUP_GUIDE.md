# 🚀 Ollama Setup Guide for Jose AI Assistant

## 📋 **Prerequisites**
- Windows 10/11 (64-bit)
- At least 8GB RAM (16GB recommended)
- ~5GB free disk space for the model
- Internet connection for initial download

---

## 🔧 **Step-by-Step Installation**

### **1. Download Ollama**

Visit the official Ollama website:
```
https://ollama.ai/download
```

**For Windows:**
- Click "Download for Windows"
- Download the `OllamaSetup.exe` installer
- File size: ~200-300MB

### **2. Install Ollama**

1. Run the `OllamaSetup.exe` file
2. Follow the installation wizard
3. Choose installation directory (default: `C:\Program Files\Ollama`)
4. Click "Install"
5. Wait for installation to complete
6. Click "Finish"

### **3. Verify Installation**

Open PowerShell or Command Prompt and run:

```powershell
ollama --version
```

**Expected output:**
```
ollama version 0.x.x
```

If you see the version number, installation was successful!

---

## 🤖 **Model Setup**

### **1. Pull the LLaMA 3 Model**

The JRMSU Library System uses the `llama3:8b-instruct-q4_K_M` model.

Open PowerShell/Command Prompt and run:

```powershell
ollama pull llama3:8b-instruct-q4_K_M
```

**What happens:**
- Downloads ~4.7GB model file
- Download time: 5-30 minutes (depends on internet speed)
- Progress bar shows download status

**Example output:**
```
pulling manifest
pulling 6a0746a1ec1a... 100% ████████████████ 4.7 GB
pulling 4fa551d4f938... 100% ████████████████ 12 KB
pulling 8ab4849b038c... 100% ████████████████ 254 B
pulling 577073ffcc6c... 100% ████████████████ 110 B
pulling ad1518640c43... 100% ████████████████ 483 B
verifying sha256 digest
writing manifest
success
```

### **2. Verify Model Installation**

Check if the model is available:

```powershell
ollama list
```

**Expected output:**
```
NAME                            ID            SIZE      MODIFIED
llama3:8b-instruct-q4_K_M      xxxxx         4.7 GB    X minutes ago
```

---

## 🎯 **Starting Ollama Service**

### **Automatic Start (Recommended)**

Ollama usually starts automatically after installation. To verify:

```powershell
# Check if Ollama is running
curl http://localhost:11434/api/tags
```

**If running, you'll see:**
```json
{"models":[{"name":"llama3:8b-instruct-q4_K_M",...}]}
```

### **Manual Start**

If Ollama is not running, start it manually:

```powershell
ollama serve
```

**Expected output:**
```
time=2025-01-01T00:00:00.000+00:00 level=INFO msg="Ollama server listening" address=127.0.0.1:11434
```

**Keep this terminal window open** while using Jose!

---

## ✅ **Testing the Integration**

### **1. Test Ollama API**

```powershell
curl http://localhost:11434/api/tags
```

Should return JSON with model information.

### **2. Test Chat Endpoint**

Create a test file `test_ollama.json`:
```json
{
  "model": "llama3:8b-instruct-q4_K_M",
  "messages": [
    {"role": "user", "content": "Hello!"}
  ],
  "stream": false
}
```

Test the chat:
```powershell
curl -X POST http://localhost:11434/api/chat -H "Content-Type: application/json" -d @test_ollama.json
```

Should return a JSON response with AI-generated text.

### **3. Test Jose in the App**

1. Start your React app:
   ```powershell
   npm run dev
   ```

2. Navigate to `http://localhost:8080`

3. Click the floating **Jose bot icon** (bottom-right)

4. Check the status indicator:
   - 🟢 **Green dot** = Jose is online and ready!
   - 🔴 **Red dot** = Ollama needs to be started

5. Send a test message:
   ```
   Hello Jose!
   ```

6. Jose should respond within 1-3 seconds

---

## 🛠️ **Troubleshooting**

### **Issue: "AI service is currently offline"**

**Solution:**
```powershell
# Check if Ollama is running
ollama list

# If not running, start it
ollama serve
```

### **Issue: Port 11434 already in use**

**Solution:**
```powershell
# Find process using port 11434
netstat -ano | findstr :11434

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Restart Ollama
ollama serve
```

### **Issue: Model not found**

**Solution:**
```powershell
# Re-download the model
ollama pull llama3:8b-instruct-q4_K_M

# Verify it's installed
ollama list
```

### **Issue: Slow responses (>5 seconds)**

**Possible causes:**
- CPU-only mode (no GPU acceleration)
- Insufficient RAM
- Background processes consuming resources

**Solutions:**
1. Close unnecessary applications
2. Upgrade to GPU-accelerated model (if you have NVIDIA GPU)
3. Use a smaller model variant

### **Issue: Model download stuck**

**Solution:**
```powershell
# Cancel current download (Ctrl+C)

# Clear Ollama cache
rd /s /q %USERPROFILE%\.ollama\models

# Try downloading again
ollama pull llama3:8b-instruct-q4_K_M
```

---

## 📊 **Performance Expectations**

### **System Requirements vs Response Time**

| CPU Type | RAM | Response Time | Quality |
|----------|-----|---------------|---------|
| i5 (8th gen) | 8GB | 3-5 seconds | Good |
| i7 (10th gen) | 16GB | 1-3 seconds | Excellent |
| Ryzen 5 5600 | 16GB | 1-2 seconds | Excellent |
| M1/M2 Mac | 16GB | 0.5-1 second | Excellent |

### **Model Variants**

If performance is slow, try these alternatives:

```powershell
# Smaller, faster model (2GB)
ollama pull llama3:8b-instruct-q4_0

# Larger, more accurate model (8GB)
ollama pull llama3:8b-instruct-q8_0
```

Update the model name in `src/services/aiService.ts`:
```typescript
const MODEL_NAME = 'llama3:8b-instruct-q4_0';
```

---

## 🔒 **Security Notes**

- Ollama runs **locally** on your machine
- No data is sent to external servers
- Chat history is stored in browser localStorage
- Safe for sensitive library data

---

## 🔄 **Updating Ollama**

### **Check for Updates**
```powershell
ollama version
```

### **Update to Latest Version**
1. Download latest installer from https://ollama.ai/download
2. Run the installer (will upgrade existing installation)
3. Re-pull the model if needed

---

## 📞 **Getting Help**

### **Official Resources**
- Ollama Documentation: https://github.com/ollama/ollama/blob/main/docs/
- Ollama Discord: https://discord.gg/ollama
- GitHub Issues: https://github.com/ollama/ollama/issues

### **JRMSU Library System**
- Check `AI_INTEGRATION_SUMMARY.md` for Jose-specific help
- Look for red status indicator in Jose widget
- Check browser console for error messages

---

## 🎉 **Quick Start Summary**

```powershell
# 1. Install Ollama (download from ollama.ai)

# 2. Pull the model
ollama pull llama3:8b-instruct-q4_K_M

# 3. Start Ollama
ollama serve

# 4. Start the React app
npm run dev

# 5. Chat with Jose!
# Click the bot icon and start chatting
```

---

## ✨ **Next Steps**

After successful setup:
1. ✅ Chat with Jose to test basic functionality
2. ✅ Try the History tab to view past conversations
3. ✅ Use Search tab to find specific messages
4. ✅ Explore book recommendations
5. ✅ Test emotion detection with different tones

**Jose is ready to help with your library needs!** 🎊

---

**Setup Date:** 2025-10-22  
**Ollama Version:** Latest stable  
**Model:** llama3:8b-instruct-q4_K_M  
**Status:** Ready for Production ✅
