# 🚀 Quick Start Guide - Jose AI Assistant
## JRMSU Library System

**5-Minute Setup | Get Jose Running Fast**

---

## ⚡ Quick Setup (3 Steps)

### 1. Install Ollama (2 minutes)
```bash
# Download Ollama from https://ollama.ai
# Or use command line:

# Windows (PowerShell)
winget install Ollama.Ollama

# Mac
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh
```

### 2. Download AI Model (1 minute)
```bash
ollama pull llama3:8b-instruct-q4_K_M
ollama serve
```

### 3. Start Application (30 seconds)
```bash
cd jrmsu-wise-library-main
npm install  # First time only
npm run dev
```

**✅ Done! Open http://localhost:5173**

---

## 🎯 Quick Feature Test

### Test 1: Chat with Jose (30 seconds)
1. Click robot icon (bottom-right corner)
2. Type: "Hello Jose"
3. Watch streaming response appear

### Test 2: AI Smart Search (30 seconds)
1. Go to Books page
2. Click blue "AI Search" button
3. Type: "programming"
4. See autocomplete suggestions

### Test 3: Admin Commands (1 minute - Admin only)
1. Login as admin
2. Open Jose chat
3. Type: "Show overdue books"
4. Watch command execute

---

## 📝 Quick Command Reference

### Student Commands
```
"Find books about Python"
"When are my books due?"
"Recommend fantasy books"
"How do I borrow a book?"
```

### Admin Commands
```
"Generate today's report"
"Show overdue books"
"Display weekly analytics"
"Backup database" (requires confirmation)
```

---

## 🔧 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Jose won't respond | Check Ollama: `ollama serve` |
| Red dot on Jose widget | Restart Ollama service |
| AI Search not working | Click "AI Search" button to enable |
| Admin commands not detected | Ensure logged in as admin |

---

## 📊 What You Get

✅ **Jose AI Chat** - Real-time conversation with AI  
✅ **Smart Search** - AI-powered book discovery  
✅ **Auto-Complete** - Instant suggestions as you type  
✅ **AI Notifications** - Smart recommendations  
✅ **Admin Commands** - Natural language operations  
✅ **Emotion Detection** - Context-aware responses  

---

## 🎓 Next Steps

1. **Read Full Docs:** `AI_FINAL_SUMMARY.md`
2. **Setup Database:** `database/ai_chat_schema.sql`
3. **Configure Security:** See Phase 9 checklist
4. **Run Tests:** See Phase 10 requirements

---

## 💡 Pro Tips

- **Keep Ollama running** in background for best performance
- **Use AI Search** for better book discovery
- **Check notification bell** for AI recommendations
- **Try admin commands** to automate tasks

---

## ⚙️ System Requirements

- **RAM:** 8GB minimum (16GB recommended)
- **Storage:** 10GB free space
- **Node.js:** v18 or higher
- **Browser:** Chrome, Edge, or Firefox
- **Ollama:** Latest version

---

## 📞 Need Help?

- **Docs:** `AI_IMPLEMENTATION_STATUS.md`
- **Setup:** `OLLAMA_SETUP_GUIDE.md`
- **Issues:** Check browser console (F12)
- **Ollama Status:** http://localhost:11434/api/tags

---

**🎉 You're ready to use Jose AI Assistant!**

**Status:** 80% Complete | **Phase:** Testing Ready | **Updated:** 2025-10-23
