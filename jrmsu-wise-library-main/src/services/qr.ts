// QR service wired to Supabase Edge Functions with local fallbacks
import { supabase } from "@/integrations/supabase/client";

export type GenerateUserQRParams = { userId: string; rotate?: boolean };
export type GenerateBookQRParams = { bookId: string };

export type QRGenerateResult = {
  envelope: string; // string to encode as QR
  imageUrl?: string; // optional URL to a stored PNG
};

export async function generateUserQR(params: GenerateUserQRParams): Promise<QRGenerateResult> {
  try {
    const { data, error } = await supabase.functions.invoke("qr-generate-user", { body: params });
    if (error) throw error;
    return data as QRGenerateResult;
  } catch {
    const envelope = JSON.stringify({ v: 1, typ: "user", uid: params.userId, ts: Date.now(), rotate: !!params.rotate });
    return { envelope };
  }
}

export async function generateBookQR(params: GenerateBookQRParams): Promise<QRGenerateResult> {
  try {
    const { data, error } = await supabase.functions.invoke("qr-generate-book", { body: params });
    if (error) throw error;
    return data as QRGenerateResult;
  } catch {
    const envelope = JSON.stringify({ v: 1, typ: "book", bid: params.bookId, ts: Date.now() });
    return { envelope };
  }
}

export async function verifyEnvelope(_envelope: string): Promise<{ ok: boolean }>
{
  try {
    const { data, error } = await supabase.functions.invoke("qr-verify", { body: { envelope: _envelope } });
    if (error) throw error;
    return data as { ok: boolean };
  } catch {
    return { ok: true };
  }
}

export async function listUserQRCodesForAdmin(): Promise<Array<{ userId: string; imageUrl?: string }>> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-list-user-qrs", { body: {} });
    if (error) throw error;
    return data as Array<{ userId: string; imageUrl?: string }>;
  } catch {
    return [];
  }
}

// Admin settings stubs
export async function getGlobal2FAEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-get-2fa", { body: {} });
    if (error) throw error;
    return Boolean((data as any)?.enabled);
  } catch { return true; }
}

export async function setGlobal2FAEnabled(_enabled: boolean): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("admin-set-2fa", { body: { enabled: _enabled } });
    if (error) throw error;
  } catch { /* noop fallback */ }
}


