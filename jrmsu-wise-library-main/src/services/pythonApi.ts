// Minimal Python API client (optional). Fallback to local logic on failure.
const BASE = "http://localhost:5000";
const json = (body?: any) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body ?? {})
});
export const pythonApi = {
  async health(): Promise<boolean> {
    try {
      const r = await fetch(`${BASE}/health`);
      return r.ok;
    } catch { return false; }
  },
  async verifyTotp(secret: string, token: string): Promise<boolean> {
    try {
      const r = await fetch(`${BASE}/2fa/verify`, {
        method: "POST",
        ...json({ secret, token, window: 3 })
      });
      if (!r.ok) return false;
      const j = await r.json();
      return Boolean(j?.valid);
    } catch { return false; }
  },
  async validateQr(data: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const r = await fetch(`${BASE}/qr/validate`, {
        method: "POST",
        ...json({ data })
      });
      if (!r.ok) return { valid: false, error: r.statusText };
      const j = await r.json();
      return { valid: Boolean(j?.valid), error: j?.error };
    } catch (e: any) { return { valid: false, error: e?.message || "Network error" }; }
  },
  // New APIs
  async getUser(userId: string) {
    const r = await fetch(`${BASE}/api/users/${encodeURIComponent(userId)}`);
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async updateUser(userId: string, updates: any) {
    const r = await fetch(`${BASE}/api/users/${encodeURIComponent(userId)}`, {
      method: "PATCH",
      ...json(updates)
    });
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async toggle2FA(userId: string, enabled: boolean, secret?: string) {
    const r = await fetch(`${BASE}/api/users/${encodeURIComponent(userId)}/2fa`, {
      method: "POST",
      ...json({ enabled, secret })
    });
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async activity(userId?: string) {
    const r = await fetch(`${BASE}/api/activity${userId ? `?userId=${encodeURIComponent(userId)}` : ''}`);
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async reportsTopBorrowed() {
    const r = await fetch(`${BASE}/api/reports/top-borrowed`);
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async reportsCategoryDist() {
    const r = await fetch(`${BASE}/api/reports/category-dist`);
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async listUsers() {
    const r = await fetch(`${BASE}/api/users`);
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async notifications(params: { filter?: 'all'|'unread'; page?: number; limit?: number }, userId: string) {
    const url = new URL(`${BASE}/api/notifications`);
    if (params.filter) url.searchParams.set('filter', params.filter);
    if (params.page) url.searchParams.set('page', String(params.page));
    if (params.limit) url.searchParams.set('limit', String(params.limit));
    const r = await fetch(url.toString(), { headers: { 'X-User-Id': userId } });
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async markNotificationsRead(notificationIds: string[], userId: string) {
    const r = await fetch(`${BASE}/api/notifications/mark-read`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Id': userId }, body: JSON.stringify({ notificationIds }) });
    if (!r.ok) throw new Error(r.statusText);
    return r.json();
  },
  async changePassword(params: { userId: string; userType: string; currentPassword: string; newPassword: string }) {
    try {
      const r = await fetch(`${BASE}/api/users/${encodeURIComponent(params.userId)}/change-password`, {
        method: 'POST',
        ...json({
          userType: params.userType,
          currentPassword: params.currentPassword,
          newPassword: params.newPassword
        })
      });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({ message: r.statusText }));
        return { success: false, message: errorData.message || 'Failed to change password' };
      }
      const data = await r.json();
      return { success: true, ...data };
    } catch (error: any) {
      return { success: false, message: error.message || 'Network error' };
    }
  },
  async resetUserPassword(params: { userId: string; userType: string; newPassword: string }) {
    try {
      const r = await fetch(`${BASE}/api/users/${encodeURIComponent(params.userId)}/reset-password`, {
        method: 'POST',
        ...json({
          userType: params.userType,
          newPassword: params.newPassword
        })
      });
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({ message: r.statusText }));
        return { success: false, message: errorData.message || 'Failed to reset password' };
      }
      const data = await r.json();
      return { success: true, ...data };
    } catch (error: any) {
      return { success: false, message: error.message || 'Network error' };
    }
  },
};
