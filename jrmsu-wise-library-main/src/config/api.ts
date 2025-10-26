// Centralized API configuration with env-driven paths for easy alignment.
// Override any value via VITE_* environment variables at build time.

export const API = {
  BASE: (import.meta as any)?.env?.VITE_API_BASE || window.location.origin,
  AUTH: {
    BASE: (import.meta as any)?.env?.VITE_AUTH_API_BASE || ( (import.meta as any)?.env?.VITE_API_BASE || "http://localhost:5000" ),
    REQUEST_RESET: (import.meta as any)?.env?.VITE_AUTH_REQUEST_RESET_PATH || "/auth/request-reset",
    VERIFY_CODE: (import.meta as any)?.env?.VITE_AUTH_VERIFY_CODE_PATH || "/auth/verify-code",
    RESET_PASSWORD: (import.meta as any)?.env?.VITE_AUTH_RESET_PASSWORD_PATH || "/auth/reset-password",
  },
  AI: {
    // If pointing directly to Ollama use http://localhost:11434
    // If using a backend proxy, set VITE_AI_API_BASE to that backend
    BASE: (import.meta as any)?.env?.VITE_AI_API_BASE || "http://localhost:11434",
    // For direct Ollama, CHAT_PATH is "/api/chat" and HEALTH_PATH is "/api/tags"
    // For backend proxy, set VITE_AI_CHAT_PATH to backend chat endpoint (e.g., "/ai/chat") and HEALTH to "/health".
    CHAT_PATH: (import.meta as any)?.env?.VITE_AI_CHAT_PATH || "/api/chat",
    HEALTH_PATH: (import.meta as any)?.env?.VITE_AI_HEALTH_PATH || "/api/tags",
  },
};
