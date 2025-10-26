import { API } from "@/config/api";

type Json = Record<string, any>;

async function post(path: string, body: Json): Promise<any> {
  // Primary target (env-driven)
  let base = API.AUTH.BASE;
  let url = `${base}${path}`;
  let r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  // Fallback: if we accidentally hit the frontend origin (8080) or 404, retry backend default
  if (!r.ok && (location.origin.includes("8080") || r.status === 404)) {
    try {
      const fallbackBase = "http://127.0.0.1:5001";
      // Map legacy /api/auth/* to backend /auth/* if needed
      const mappedPath = path.startsWith("/api/auth/") ? path.replace("/api/auth/", "/auth/") : path;
      url = `${fallbackBase}${mappedPath}`;
      r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
    } catch {}
  }

  let data: any = null;
  try { data = await r.json(); } catch {}
  if (!r.ok) {
    const msg = data?.error || data?.message || r.statusText || "Request failed";
    throw new Error(msg);
  }
  return data;
}

export const AuthResetService = {
  async requestResetByEmail(params: { userId?: string; email: string; fullName?: string }) {
    return post(API.AUTH.REQUEST_RESET, { method: "email", ...params });
  },
  async requestResetByAdmin(params: { userId?: string; email?: string; fullName?: string }) {
    return post(API.AUTH.REQUEST_RESET, { method: "admin", ...params });
  },
  async verifyCode(params: { email: string; code: string }) {
    return post(API.AUTH.VERIFY_CODE, params);
  },
  async resetPassword(params: { userId?: string; email: string; code: string; newPassword: string }) {
    return post(API.AUTH.RESET_PASSWORD, params);
  },
};
