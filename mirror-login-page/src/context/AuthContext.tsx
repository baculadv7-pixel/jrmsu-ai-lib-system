import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { verifyTotpToken } from "@/utils/totp";
import { databaseService, User } from "@/services/database";
import { ActivityService } from "@/services/activity";
import { NotificationsService } from "@/services/notifications";
import type { QRLoginData } from "@/services/qr";

export type UserRole = "student" | "admin";

export interface AuthUser extends Omit<User, 'userType' | 'passwordHash'> {
  role: UserRole; // Maps to userType from database
  authKey?: string; // TOTP secret (maps to twoFactorKey from database)
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (params: { id: string; password: string; role: UserRole }) => Promise<void>;
  signInWithQR: (qrData: QRLoginData) => Promise<void>;
  signOut: () => void;
  enableTwoFactor: (authKey: string) => void;
  disableTwoFactor: () => void;
  verifyTotp: (token: string) => boolean;
  refreshSession: () => void;
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = "jrmsu_auth_session";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Define signOut before effects to avoid temporal dead zone in dependencies
  const signOut = useCallback(() => {
    try { if (user?.id) ActivityService.log(user.id, 'logout'); } catch { /* noop */ }
    localStorage.removeItem('token');
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, [user?.id]);

  useEffect(() => {
    // Persist session across refresh: if AUTH storage missing but token exists, hydrate from token
    try {
      const rawSession = localStorage.getItem(AUTH_STORAGE_KEY);
      if (rawSession) {
        const parsed = JSON.parse(rawSession) as AuthUser;
        setUser(parsed);
      } else {
        const token = localStorage.getItem('token');
        if (token && token.startsWith('jwt.')) {
          const payload = token.split('.')[1];
          try {
            const decoded = atob(payload);
            const userId = decoded.split('.')[0];
            if (userId) {
              const dbUser = databaseService.getUserById(userId as string);
              if (dbUser) {
                const session: AuthUser = { ...dbUser, role: dbUser.userType as UserRole, authKey: dbUser.twoFactorKey };
                localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
                setUser(session);
              }
            }
          } catch { /* noop */ }
        }
      }
    } catch { /* noop */ }

    // Inactivity auto-logout: 30 minutes
    let timer: any = null;
    const reset = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => signOut(), 30 * 60 * 1000); };
    ['click','mousemove','keydown','scroll','touchstart'].forEach(ev => window.addEventListener(ev, reset, { passive: true } as any));
    reset();
    return () => { if (timer) clearTimeout(timer); ['click','mousemove','keydown','scroll','touchstart'].forEach(ev => window.removeEventListener(ev, reset as any)); };
  }, [signOut]);

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
    
    console.log('🔐 Attempting manual login:', { id, role });
    
    // Try backend API first (shared MySQL database)
    try {
      console.log('🌐 Trying backend API authentication...');
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password, userType: role })
      });
      
      if (response.ok) {
        const backendUser = await response.json();
        console.log('✅ Backend authentication successful');
        
        // Convert to AuthUser format
        const session: AuthUser = {
          ...backendUser,
          role: backendUser.userType as UserRole,
          authKey: backendUser.twoFactorKey
        };
        
        const token = `jwt.${btoa(`${backendUser.id}.${Date.now()}`)}`;
        localStorage.setItem('token', token);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        setUser(session);
        
        try { ActivityService.log(backendUser.id, 'login'); } catch {}
        console.log(`✅ User authenticated via backend API: ${backendUser.fullName} (${backendUser.id})`);
        return;
      } else {
        console.warn('⚠️ Backend authentication failed, trying localStorage fallback...');
      }
    } catch (error) {
      console.warn('⚠️ Backend unavailable, trying localStorage fallback...', error);
    }
    
    // Fallback to localStorage if backend is unavailable
    console.log('📦 Using localStorage fallback...');
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
    
    const token = `jwt.${btoa(`${dbUser.id}.${Date.now()}`)}`;
    localStorage.setItem('token', token);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    
    try { ActivityService.log(dbUser.id, 'login'); } catch {}
    console.log(`✅ User authenticated via localStorage: ${dbUser.fullName} (${dbUser.id})`);
  };

  const signInWithQR = async (qrData: QRLoginData) => {
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
    const token = `jwt.${btoa(`${dbUser.id}.${Date.now()}`)}`;
    localStorage.setItem('token', token);

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    try {
      const r = await fetch('http://localhost:5000/api/users/' + encodeURIComponent(dbUser.id));
      if (r.ok) {
        const backendUser = await r.json();
        const merged = { ...session, ...backendUser };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(merged));
        setUser(merged);
      }
    } catch {}

    try { ActivityService.log(dbUser.id, 'login', 'QR'); } catch { /* noop */ }
    console.log(`✅ User authenticated successfully via QR login: ${dbUser.fullName} (${dbUser.id})`);
  };


  const enableTwoFactor = (authKey: string) => {
    if (!user) return;
    const normalized = (authKey || '').toString().replace(/\s+/g, '').toUpperCase();
    // Persist to database for accuracy across sessions
    const dbUpdate = databaseService.updateUser(user.id, { twoFactorEnabled: true, twoFactorKey: normalized });
    try { fetch('http://localhost:5000/api/users/' + encodeURIComponent(user.id) + '/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: true, secret: normalized }) }); } catch {}
    const persisted = dbUpdate.success && dbUpdate.user ? dbUpdate.user : { ...user, twoFactorEnabled: true, twoFactorKey: normalized };
    const updated: AuthUser = { ...persisted, role: (persisted.userType as UserRole), authKey: persisted.twoFactorKey };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
    try { ActivityService.log(user.id, '2fa_enable'); NotificationsService.add({ receiverId: user.id, type: 'system', message: 'Two-factor authentication enabled.' }); } catch {}
  };

  const disableTwoFactor = () => {
    if (!user) return;
    // Persist to database for accuracy across sessions
    const dbUpdate = databaseService.updateUser(user.id, { twoFactorEnabled: false, twoFactorKey: undefined });
    try { fetch('http://localhost:5000/api/users/' + encodeURIComponent(user.id) + '/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: false }) }); } catch {}
    const persisted = dbUpdate.success && dbUpdate.user ? dbUpdate.user : { ...user, twoFactorEnabled: false, twoFactorKey: undefined } as any;
    const updated: AuthUser = { ...persisted, role: (persisted.userType as UserRole), authKey: undefined };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
    try { ActivityService.log(user.id, '2fa_disable'); NotificationsService.add({ receiverId: user.id, type: 'system', message: 'Two-factor authentication disabled.' }); } catch {}
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
      }).catch(() => { /* noop */ });
      return localOk;
    } catch {
      return verifyTotpToken(secret, token, [5, 5]);
    }
  };

  const refreshSession = () => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  };

  const updateUser = (partial: Partial<AuthUser>) => {
    setUser((prev) => {
      const next = { ...(prev as AuthUser), ...partial } as AuthUser;
      try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
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
    refreshSession,
    updateUser,
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


