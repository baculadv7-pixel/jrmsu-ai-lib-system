import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { verifyTotpToken } from "@/utils/totp";
import { databaseService, User } from "@/services/database";

export type UserRole = "student" | "admin";

export interface AuthUser extends Omit<User, 'userType' | 'passwordHash'> {
  role: UserRole; // Maps to userType from database
  authKey?: string; // TOTP secret (maps to twoFactorKey from database)
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (params: { id: string; password: string; role: UserRole }) => Promise<void>;
  signInWithQR: (qrData: any) => Promise<void>;
  signOut: () => void;
  enableTwoFactor: (authKey: string) => void;
  disableTwoFactor: () => void;
  verifyTotp: (token: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = "jrmsu_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AuthUser;
        setUser(parsed);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }, []);

  const signIn = async ({ id, password, role }: { id: string; password: string; role: UserRole }) => {
    if (!id || !password) {
      throw new Error("ID and password are required");
    }
    
    // Validate ID format based on role
    if (role === "admin" && !/^KCL-\d{5}$/.test(id)) {
      throw new Error("Admin ID must match KCL-00000 format");
    }
    if (role === "student" && !/^KC-\d{2}-[A-D]-\d{5}$/.test(id)) {
      throw new Error("Student ID must match KC-00-A-00000 format");
    }
    
    // Authenticate using database service
    const authResult = databaseService.authenticateUser(id, password);
    
    if (!authResult.success || !authResult.user) {
      throw new Error(authResult.error || "Authentication failed");
    }
    
    const dbUser = authResult.user;
    
    // Verify role matches user type in database
    if (dbUser.userType !== role) {
      throw new Error(`Invalid user type. Expected ${role}, but user is ${dbUser.userType}`);
    }
    
    // Convert database user to AuthUser format
    const session: AuthUser = {
      ...dbUser,
      role: dbUser.userType as UserRole,
      authKey: dbUser.twoFactorKey
    };
    
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    
    console.log(`✅ User authenticated via manual login: ${dbUser.fullName} (${dbUser.id})`);
  };

  const signInWithQR = async (qrData: any) => {
    console.log('🆔 AuthContext - Processing QR login:', {
      userId: qrData.userId,
      userType: qrData.userType,
      systemId: qrData.systemId,
      systemTag: qrData.systemTag,
      hasSessionToken: !!qrData.sessionToken,
      fullName: qrData.fullName?.slice(0, 20) + '...' || 'N/A'
    });
    
    // Validate basic QR data structure (streamlined requirements)
    if (!qrData.userId || !qrData.userType || !qrData.fullName || !qrData.systemId || !qrData.systemTag) {
      throw new Error("Invalid QR Code. Missing required fields.");
    }
    
    if (qrData.systemId !== "JRMSU-LIBRARY") {
      throw new Error("Invalid QR Code. Please scan a valid JRMSU Library System QR Code.");
    }
    
    // Validate authentication token (prefer encryptedPasswordToken; accept legacy sessionToken/encryptedToken)
    const hasAuth = qrData.encryptedPasswordToken || qrData.sessionToken || qrData.encryptedToken || qrData.authCode;
    if (!hasAuth) {
      throw new Error("Invalid QR Code. Missing authentication token.");
    }
    
    // Authenticate using database service with QR data
    console.log('🔐 AuthContext - Calling database authentication...');
    const authResult = databaseService.authenticateWithQRCode(qrData);
    
    console.log('🔍 AuthContext - Database auth result:', {
      success: authResult.success,
      hasUser: !!authResult.user,
      error: authResult.error
    });
    
    if (!authResult.success || !authResult.user) {
      console.error('❌ AuthContext - QR authentication failed:', authResult.error);
      throw new Error(authResult.error || "QR Code authentication failed");
    }
    
    const dbUser = authResult.user;
    console.log('✅ AuthContext - Database user found:', {
      id: dbUser.id,
      fullName: dbUser.fullName,
      userType: dbUser.userType,
      isActive: dbUser.isActive
    });
    
    // Convert database user to AuthUser format
    const session: AuthUser = {
      ...dbUser,
      role: dbUser.userType as UserRole,
      authKey: dbUser.twoFactorKey
    };
    
    console.log('💾 AuthContext - Saving session to localStorage...');
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    
    console.log(`✅ User authenticated successfully via QR login: ${dbUser.fullName} (${dbUser.id})`);
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const enableTwoFactor = (authKey: string) => {
    if (!user) return;
    const normalized = (authKey || '').toString().replace(/\s+/g, '').toUpperCase();
    // Persist to database for accuracy across sessions
    const dbUpdate = databaseService.updateUser(user.id, { twoFactorEnabled: true, twoFactorKey: normalized });
    const persisted = dbUpdate.success && dbUpdate.user ? dbUpdate.user : { ...user, twoFactorEnabled: true, twoFactorKey: normalized };
    const updated: AuthUser = { ...persisted, role: (persisted.userType as UserRole), authKey: persisted.twoFactorKey };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  const disableTwoFactor = () => {
    if (!user) return;
    // Persist to database for accuracy across sessions
    const dbUpdate = databaseService.updateUser(user.id, { twoFactorEnabled: false, twoFactorKey: undefined });
    const persisted = dbUpdate.success && dbUpdate.user ? dbUpdate.user : { ...user, twoFactorEnabled: false, twoFactorKey: undefined } as any;
    const updated: AuthUser = { ...persisted, role: (persisted.userType as UserRole), authKey: undefined };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  const verifyTotp = (token: string): boolean => {
    // Load latest secret from context or session, normalize
    const sessionRaw = localStorage.getItem(AUTH_STORAGE_KEY);
    const session = (() => { try { return sessionRaw ? JSON.parse(sessionRaw) : null; } catch { return null; } })();
    const secret = (user?.authKey || session?.authKey || session?.twoFactorKey || "").toString();
    const enabled = Boolean(user?.twoFactorEnabled ?? session?.twoFactorEnabled);
    if (!enabled || !secret) return false;

    try {
      // Wider local window to tolerate clock drift
      const localOk = verifyTotpToken(secret, token, [5, 5]);
      // Fire-and-forget Python verification as a secondary check (non-blocking)
      fetch("http://127.0.0.1:5001/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, token, window: 2 }),
      }).catch(() => {});
      return localOk;
    } catch {
      return verifyTotpToken(secret, token, [5, 5]);
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    signIn,
    signInWithQR,
    signOut,
    enableTwoFactor,
    disableTwoFactor,
    verifyTotp,
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


