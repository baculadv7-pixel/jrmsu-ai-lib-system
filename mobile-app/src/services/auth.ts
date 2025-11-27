// JRMSU AI-Library System - Mobile auth service
// ---------------------------------------------
// This module is meant to REUSE core logic from `shared/database.ts`
// and point the mobile app at the same backend endpoints used by the web app.

import { API } from '../../config/api';
import { databaseService, type AuthResult, type UserRole } from '../../../shared/database';

export interface LoginParams {
  id: string;
  password: string;
  role: UserRole;
}

// Example wrapper that first tries the backend HTTP login endpoint
// and can fall back to shared `databaseService` logic if you wish.
export async function login({ id, password, role }: LoginParams): Promise<AuthResult> {
  if (!id || !password) {
    return { success: false, error: 'ID and password are required' };
  }

  try {
    const res = await fetch(`${API.BACKEND_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text || `HTTP ${res.status}` };
    }

    const data = await res.json();
    const user = data.user as any;
    return {
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName || user.full_name || user.id,
        userType: user.userType || user.role || role,
        twoFactorEnabled: Boolean(user.twoFactorEnabled),
      },
    };
  } catch (e: any) {
    console.warn('[mobile auth] HTTP login failed, falling back to shared databaseService:', e?.message || e);
    // Optional fallback to shared in-memory databaseService, if you
    // port the real logic into shared/database.ts.
    return databaseService.authenticateUser(id, password);
  }
}

export async function loginWithQR(qrData: any): Promise<AuthResult> {
  try {
    // You can POST qrData to a backend endpoint or call
    // databaseService.authenticateWithQRCode directly.
    return databaseService.authenticateWithQRCode(qrData);
  } catch (e: any) {
    return { success: false, error: e?.message || 'QR login failed' };
  }
}
