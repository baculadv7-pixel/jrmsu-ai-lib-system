// Centralized API configuration with env-driven paths for easy alignment.
// Override any value via VITE_* environment variables at build time.

export const API = {
  BASE: (import.meta as any)?.env?.VITE_API_BASE || window.location.origin,
  BACKEND: {
    BASE: (import.meta as any)?.env?.VITE_BACKEND_BASE || "http://localhost:5000",
  },
  AUTH: {
    BASE: (import.meta as any)?.env?.VITE_AUTH_API_BASE || ( (import.meta as any)?.env?.VITE_BACKEND_BASE || ( (import.meta as any)?.env?.VITE_API_BASE || "http://localhost:5000" ) ),
    REQUEST_RESET: (import.meta as any)?.env?.VITE_AUTH_REQUEST_RESET_PATH || "/auth/request-reset",
    VERIFY_CODE: (import.meta as any)?.env?.VITE_AUTH_VERIFY_CODE_PATH || "/auth/verify-code",
    RESET_PASSWORD: (import.meta as any)?.env?.VITE_AUTH_RESET_PASSWORD_PATH || "/auth/reset-password",
  },
  AI: {
    // Default to AI server proxy on 5002; override via VITE_AI_API_BASE to use a different host
    BASE: (import.meta as any)?.env?.VITE_AI_API_BASE || "http://localhost:5002",
    // When using AI server, paths are "/ai/chat" and "/ai/health"; when pointing to Ollama, use "/api/chat" and "/api/tags"
    CHAT_PATH: (import.meta as any)?.env?.VITE_AI_CHAT_PATH || "/ai/chat",
    HEALTH_PATH: (import.meta as any)?.env?.VITE_AI_HEALTH_PATH || "/ai/health",
  },
};
