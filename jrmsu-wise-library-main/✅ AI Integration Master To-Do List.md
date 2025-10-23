✅ **AI Integration Master To-Do List (Jose — JRMSU Library Data System)**

*(All items are in action/task form — no code, only structured instructions.)*

---

## ⚙️ **PHASE 1 — Environment & Setup**

* [ ] Install and configure **Ollama** with model `llama3:8b-instruct-q4_K_M`.
* [ ] Verify Ollama is running locally at `http://localhost:11434`.
* [ ] Create a new **AI backend service layer** dedicated to “Jose”.
* [ ] Define secure API routes for chat, emotion, notification, and search services.
* [ ] Confirm all frontend and backend connections remain stable post-integration.
* [ ] Document all environment configurations and dependencies installed.

---

## 🔗 **PHASE 2 — Backend Integration**

* [ ] Establish a connection between the backend and Ollama API.
* [ ] Implement **input validation** for all chat and search requests.
* [ ] Create **database tables** for chat history, emotion logs, and notifications.
* [ ] Configure **real-time communication** via WebSockets or SSE.
* [ ] Add backend **security and logging layers** for permission and usage tracking.
* [ ] Define system prompts and persona rules for “Jose” (tone, role, limitations).
* [ ] Test communication loop: user input → AI response → database save.

---

## 💬 **PHASE 3 — Frontend Chat UI & Assistant Component**

* [ ] Create a floating AI assistant widget named **“Jose”** (bottom-right of screen).
* [ ] Add modes: **Chat**, **History**, **Search Chats**, and **Library**.
* [ ] Connect frontend chat interface to backend `/api/ai/chat` and `/ws/ai`.
* [ ] Enable multiple input modes — **text**, **voice**, and **image**.
* [ ] Keep design and UI aligned with the current system theme.
* [ ] Ensure chat opens persistently across all pages.
* [ ] Fetch the latest 5 messages from the history API when chat loads.
* [ ] Add user emotion indicator icon in chat interface (optional visual cue).

---

## 🧠 **PHASE 4 — Real-Time AI Features & Emotion Intelligence**

* [ ] Enable **real-time message streaming** (typing animation effect).
* [ ] Implement **emotion detection** for text tone analysis.
* [ ] Optionally integrate **webcam emotion detection** (user consent required).
* [ ] Adjust “Jose’s” response tone dynamically based on detected emotion.
* [ ] Connect **AI notifications** with existing system notification bell.
* [ ] Push overdue alerts, book recommendations, and system updates in real time.
* [ ] Save all AI-triggered notifications to the database.
* [ ] Add backend logic to detect specific keywords (e.g., “backup”, “report”) and auto-trigger admin actions or alerts.

---

## 📚 **PHASE 5 — Smart Search & AI-Powered Query System**

* [ ] Implement an **AI-enhanced search bar** with predictive results.
* [ ] Auto-complete book titles, authors, or categories as the user types.
* [ ] Display instant book info: title, author, availability, and category.
* [ ] Allow search input via **voice** and **image recognition** (optional).
* [ ] Connect QR code scanning for direct book lookup.
* [ ] Use AI re-ranking to prioritize results based on context and intent.
* [ ] Ensure smooth transition between search results and book details page.

---

## 🔔 **PHASE 6 — AI Notification & Reporting System**

* [ ] Integrate AI notifications with existing Notification Bell and Message Box.
* [ ] Enable **real-time WebSocket updates** for borrow/return events.
* [ ] Display categorized notifications: All, Unread, System, AI Suggestions.
* [ ] Log all notifications in the backend for audit tracking.
* [ ] Allow “Jose” to generate summarized reports for admins (e.g., daily activity).
* [ ] Add support for commands like: “Generate today’s borrow report” or “Show overdue list.”

---

## 🧾 **PHASE 7 — Database & Logging Integration**

* [ ] Create `chat_history` table for all AI messages (user and assistant).
* [ ] Store session IDs to group related messages.
* [ ] Add `emotion` column to store detected tone.
* [ ] Link chat logs with `user_id` from student/admin tables.
* [ ] Connect notifications to relevant user entries.
* [ ] Set automatic log cleanup policy (e.g., delete logs after 90 days).

---

## 🛠 **PHASE 8 — Admin System Commands**

* [ ] Allow “Jose” to execute admin-only functions via verified requests:

  * Backup & restore database.
  * Rebuild or sync QR codes.
  * Generate audit and activity reports.
* [ ] Require **2FA confirmation** before performing critical operations.
* [ ] Provide progress feedback (e.g., “Backup in progress…”).
* [ ] Store all admin-AI interactions in the `system_logs` table for audit tracking.

---

## 🧩 **PHASE 9 — Security, Privacy & Access Control**

* [ ] Require authentication for all AI interactions (no guest access).
* [ ] Restrict system-level commands to admin roles only.
* [ ] Use JWT or session-based tokens for API verification.
* [ ] Sanitize all text inputs to prevent prompt injection.
* [ ] Encrypt all chat histories and emotion data in storage.
* [ ] Allow users to **opt out** of chat logging in their settings.
* [ ] Ensure facial data (if used) is never stored or transmitted.

---

## 🧪 **PHASE 10 — Testing & Validation**

* [ ] Test Ollama connectivity and model response time.
* [ ] Simulate multiple users interacting simultaneously.
* [ ] Verify all WebSocket streams update live.
* [ ] Confirm that all chat histories persist after refresh or logout.
* [ ] Validate emotion classification accuracy.
* [ ] Run admin commands for report generation and check output.
* [ ] Test AI assistant performance under high load (stress test).

---

## 🚀 **PHASE 11 — Optimization & Deployment**

* [ ] Optimize backend query response and caching.
* [ ] Compress chat payloads for faster delivery.
* [ ] Fine-tune Ollama’s system prompt for accuracy and tone.
* [ ] Validate synchronization between AI, frontend, backend, and database.
* [ ] Conduct final user acceptance testing (UAT) with both admin and student roles.
* [ ] Deploy stable version of “Jose” across all environments (localhost → production).
* [ ] Schedule automatic AI service restart and health monitoring on deployment server.

---

✅ **End Goal:**
Integrate “Jose” as a fully functional, real-time, emotion-aware AI assistant across all JRMSU Library Data System modules — synchronized with the database, backend, and frontend, enhancing both student and admin experiences.


Reminder:
dont ever change the design and ui just add if needed
REMOVE ANY duplication / temporar then merge the duplication / temporary or test file to the original that has almost similar functionality, Do not keep or create any temporary files named normal, basic, demo, simple, test, testing, tmp, temp, or similar — remove or archive them outside the project if necessary.
Dont change the design, and ui. 

still dont change anything in the frontend, backend and database, add, insert, apply and fix only if you needed to base on todolist.


show me the requirements structure