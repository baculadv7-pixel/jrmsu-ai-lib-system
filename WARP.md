# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

Frontend (jrmsu-wise-library-main):
- Install: npm install --prefix jrmsu-wise-library-main
- Dev server: npm run dev --prefix jrmsu-wise-library-main
- Build (prod): npm run build --prefix jrmsu-wise-library-main
- Build (dev mode chunks): npm run build:dev --prefix jrmsu-wise-library-main
- Preview built app: npm run preview --prefix jrmsu-wise-library-main
- Lint: npm run lint --prefix jrmsu-wise-library-main
- Tests (all): npm run test --prefix jrmsu-wise-library-main
- Tests (watch): npm run test:watch --prefix jrmsu-wise-library-main
- Run a single test file: npm run test --prefix jrmsu-wise-library-main -- tests/aiService.test.ts

Python backend (optional helpers at python-backend):
- Create venv (example): python -m venv .venv && .venv/Scripts/Activate.ps1
- Install deps: pip install -r jrmsu-wise-library-main/python-backend/requirements.txt
- Typical local services referenced in TS code:
  - Flask API base: http://localhost:5000
  - AI proxy/health: http://localhost:5002 (if used)
  - Ollama: http://localhost:11434

Environment overrides used by the app (via Vite):
- VITE_API_BASE
- VITE_BACKEND_BASE
- VITE_AUTH_API_BASE, VITE_AUTH_REQUEST_RESET_PATH, VITE_AUTH_VERIFY_CODE_PATH, VITE_AUTH_RESET_PASSWORD_PATH
- VITE_AI_API_BASE, VITE_AI_CHAT_PATH, VITE_AI_HEALTH_PATH
- VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY

Examples:
- Use a custom AI base and paths:
  $env:VITE_AI_API_BASE="http://localhost:11434"; $env:VITE_AI_CHAT_PATH="/api/chat"; $env:VITE_AI_HEALTH_PATH="/api/tags"; npm run dev --prefix jrmsu-wise-library-main

## Architecture overview

Top-level projects
- jrmsu-wise-library-main: Vite + React + TypeScript frontend using shadcn/ui and Tailwind. Business logic lives under src/services, routing in src/App.tsx with lazy-loaded pages and guards, and global state via context providers (e.g., AuthContext, RegistrationContext). Tests use Vitest under tests/.
- python-backend: dependency list for a Flask-based helper service (2FA verification, QR validation, reports) referenced by the frontend. The repo contains requirements but not the Flask app code here; endpoints are expected at http://localhost:5000.

Key frontend subsystems
- Routing and layout: src/App.tsx sets up createBrowserRouter, lazy routes, ProtectedRoute and RoleGuard. QueryClientProvider, Tooltip/Toast providers, and RegistrationProvider wrap the app. RouteTracker persists last visited page via PreferenceService.
- Authentication: src/context/AuthContext.tsx manages in-browser auth session, QR login, optional 2FA, inactivity logout, and localStorage-backed persistence. It integrates with local databaseService and optionally hydrates from a backend at /api/users/:id on localhost:5000.
- API configuration: src/config/api.ts centralizes base URLs and paths and reads VITE_* env vars to switch between local Flask, an AI proxy, or direct Ollama.
- Supabase integration: src/integrations/supabase/client.ts builds a real client when VITE_SUPABASE_* vars exist, otherwise returns a safe stub to avoid runtime crashes.
- AI services: src/services/aiService.ts provides chat with the local Ollama model (default llama3:8b-instruct-q4_K_M) and a lightweight emotion analysis. It supports both direct Ollama calls (streaming via /ai/chat with stream=true) and a proxy path when configured. Chat history persists in localStorage with opt-out support. Tests cover emotion and admin command detection.
- Python API client: src/services/pythonApi.ts wraps optional Flask endpoints for 2FA verification, QR validation, user/profile updates, activity, reports, and notifications.
- Feature services: src/services/* implement domain logic (books, reservations, notifications, dashboards, QR, borrowing rules, etc.), while components/ui contains shadcn-based primitives and higher-level widgets (including an AI assistant UI).

Testing and linting
- Testing: Vitest configured via package.json; jsdom is available as a dev dependency. Example file: tests/aiService.test.ts. Run a single test by appending a path after the test script.
- Linting: ESLint configured in eslint.config.js using typescript-eslint, react-refresh, and react-hooks rules. Run with npm run lint.

Build/dev specifics
- Vite dev server listens on port 8080 with strictPort. The production build customizes Rollup manualChunks to vendor-split node_modules packages and raises chunkSizeWarningLimit to 1200.
- Path alias @ -> ./src configured in vite.config.ts.

Operational notes pulled from docs in md/
- Quick start for AI: install and run Ollama, pull model llama3:8b-instruct-q4_K_M, and keep the service running so the Jose assistant and AI search can connect. See md/QUICK_START_GUIDE.md and md/AI_INTEGRATION_SUMMARY.md for end-to-end usage and troubleshooting.
- The frontend expects optional local services on http://localhost:5000 (Flask) and can point AI calls either to http://localhost:11434 (/api/chat, /api/tags) or an AI proxy at http://localhost:5002 (/ai/chat, /ai/health), controlled by VITE_AI_* env vars.

## How future Warp agents should work here
- Prefer running frontend scripts via --prefix jrmsu-wise-library-main to avoid changing directories.
- When developing AI features, verify the configured AI base is reachable using the health path from API config before running tests that hit Ollama-dependent code.
- Use the centralized API config (src/config/api.ts) and VITE_* env vars instead of hardcoding URLs.
- For auth-related changes, consider both manual and QR login paths in AuthContext, and make sure session persistence and inactivity logout remain intact.
- When adding services, follow existing patterns under src/services and inject through pages/components rather than coupling to UI primitives.
