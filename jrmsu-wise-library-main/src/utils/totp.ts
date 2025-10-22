import * as OTPAuth from 'otpauth';
import { authenticator } from 'otplib';

function normalizeSecret(secret: string): string {
  return (secret || '').toString().replace(/\s+/g, '').toUpperCase();
}

export function verifyTotpToken(secret: string, token: string, window: [number, number] = [2, 2]): boolean {
  try {
    const cleanedToken = (token || '').toString().replace(/\D/g, '').slice(0, 6);
    if (cleanedToken.length !== 6) return false;
    const normalized = normalizeSecret(secret);
    // Engine 1: OTPAuth
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromB32(normalized),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    const delta = totp.validate({ token: cleanedToken, window });
    if (delta !== null) return true;
    // Engine 2: otplib fallback with generous window
    try {
      return authenticator.verify({ token: cleanedToken, secret: normalized, window: 20 });
    } catch {
      // ignore
    }
    return false;
  } catch {
    return false;
  }
}

export function currentTotpCode(secret: string): string | null {
  try {
    const normalized = normalizeSecret(secret);
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromB32(normalized),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    return totp.generate();
  } catch {
    return null;
  }
}