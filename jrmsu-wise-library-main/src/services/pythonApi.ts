// Minimal Python API client (optional). Fallback to local logic on failure.
export const pythonApi = {
  async health(): Promise<boolean> {
    try {
      const r = await fetch("http://localhost:5000/health");
      return r.ok;
    } catch { return false; }
  },
  async verifyTotp(secret: string, token: string): Promise<boolean> {
    try {
      const r = await fetch("http://localhost:5000/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, token, window: 3 })
      });
      if (!r.ok) return false;
      const j = await r.json();
      return Boolean(j?.valid);
    } catch { return false; }
  },
  async validateQr(data: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const r = await fetch("http://localhost:5000/qr/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
      });
      if (!r.ok) return { valid: false, error: r.statusText };
      const j = await r.json();
      return { valid: Boolean(j?.valid), error: j?.error };
    } catch (e: any) { return { valid: false, error: e?.message || "Network error" }; }
  }
};
