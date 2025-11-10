import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { verifyTotpToken } from "@/utils/totp";
import { databaseService, User } from "@/services/database";
import { ActivityService } from "@/services/activity";
import { NotificationsService } from "@/services/notifications";
import type { QRLoginData } from "@/services/qr";
import { API } from "@/config/api";

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

  // Realtime: keep current user in sync with backend DB changes
  useEffect(() => {
    let disconnect: (() => void) | null = null;
    (async () => {
      const { connectRealtime } = await import("@/services/backendRealtime");
      disconnect = await connectRealtime(async (ev, payload) => {
        const uid = user?.id;
        if (!uid) return;
        // If this event appears relevant to current user, refetch latest user from backend
        if (
          ev === 'user.updated' || ev === 'students.updated' || ev === 'admins.updated'
        ) {
          try {
            const base = API.BACKEND.BASE;
            const r = await fetch(`${base}/api/users/` + encodeURIComponent(uid));
            if (r.ok) {
              const backendUser = await r.json();
              updateUser({ ...backendUser });
            }
          } catch {}
        }
      }, { userId: user?.id });
    })();
    return () => { try { disconnect?.(); } catch {} };
  }, [user?.id]);

  const signIn = async ({ id, password, role }: { id: string; password: string; role: UserRole }) => {
    if (!id || !password) {
      throw new Error("ID and password are required");
    }
    
    // Validate ID format (relaxed: let backend be source of truth, warn only)
    if (role === "admin" && !/^KCL-\d{3,6}$/.test(id)) {
      console.warn("Admin ID format unexpected; attempting backend lookup anyway.");
    }
    if (role === "student" && !/^KC-\d{2}-[A-Z]-\d{3,6}$/.test(id)) {
      console.warn("Student ID format unexpected; attempting backend lookup anyway.");
    }
    
    // Query backend user info (shared MySQL database)
    try {
      const base = API.BACKEND.BASE;
      // Preferred: server-side bcrypt validation
      try {
        const r = await fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, password })
        });
        if (r.ok) {
          const data = await r.json();
          const backendUser = data.user || data;
          const resolvedRole: UserRole = (backendUser.role || backendUser.userType || role) as UserRole;
          const session: AuthUser = {
            ...(backendUser || {}),
            id: backendUser.id || backendUser.studentId || backendUser.adminId || id,
            role: resolvedRole,
            authKey: backendUser.twoFactorKey || backendUser.twoFactorSetupKey,
            fullName: backendUser.fullName || [backendUser.lastName, backendUser.firstName, backendUser.middleName].filter(Boolean).join(', ')
          } as AuthUser;
          const token = `jwt.${btoa(`${session.id}.${Date.now()}`)}`;
          localStorage.setItem('token', token);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
          setUser(session);
          try { ActivityService.log(session.id, 'login'); } catch {}
          return;
        }
      } catch {}
      // Try declared role first, then the other role as fallback
      const endpoints = role === 'admin'
        ? [`${base}/api/admins/${encodeURIComponent(id)}`, `${base}/api/students/${encodeURIComponent(id)}`]
        : [`${base}/api/students/${encodeURIComponent(id)}`, `${base}/api/admins/${encodeURIComponent(id)}`];
      let backendUser: any = null;
      for (const url of endpoints) {
        const res = await fetch(url);
        if (res.ok) { backendUser = await res.json(); break; }
      }
      if (backendUser) {
        const resolvedRole: UserRole = (backendUser.role || backendUser.userType || role) as UserRole;
        const session: AuthUser = {
          ...(backendUser || {}),
          id: backendUser.id || backendUser.studentId || backendUser.adminId || id,
          role: resolvedRole,
          authKey: backendUser.twoFactorKey || backendUser.twoFactorSetupKey,
          fullName: backendUser.fullName || [backendUser.lastName, backendUser.firstName, backendUser.middleName].filter(Boolean).join(', ')
        } as AuthUser;
        const token = `jwt.${btoa(`${session.id}.${Date.now()}`)}`;
        localStorage.setItem('token', token);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        setUser(session);
        try { ActivityService.log(session.id, 'login'); } catch {}
        return;
      }
    } catch { /* fall back */ }
    
    // Fallback to localStorage if backend record not found
    const authResult = databaseService.authenticateUser(id, password);
    
    if (!authResult.success || !authResult.user) {
      throw new Error(authResult.error || "Authentication failed");
    }
    
    const dbUser = authResult.user;
    
    // Convert database user to AuthUser format
    const session: AuthUser = {
      ...dbUser,
      role: (dbUser.userType as UserRole),
      authKey: dbUser.twoFactorKey
    };
    
    const token = `jwt.${btoa(`${dbUser.id}.${Date.now()}`)}`;
    localStorage.setItem('token', token);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setUser(session);
    
    try { ActivityService.log(dbUser.id, 'login'); } catch {}
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
    
    // Validate basic QR data structure
    if (!qrData.userId || !qrData.userType || !qrData.fullName || !qrData.systemId || !qrData.systemTag) {
      throw new Error("Invalid QR Code. Missing required fields.");
    }
    if (qrData.systemId !== "JRMSU-LIBRARY") {
      throw new Error("Invalid QR Code. Please scan a valid JRMSU Library System QR Code.");
    }
    
    // Validate token presence (sessionToken/encrypted/etc.)
    const hasAuth = qrData.encryptedPasswordToken || qrData.sessionToken || qrData.encryptedToken || qrData.authCode;
    if (!hasAuth) {
      throw new Error("Invalid QR Code. Missing authentication token.");
    }

    // Fetch user from shared backend DB by declared type, then fallback to other type
    const base = API.BACKEND.BASE;
    const endpoints = qrData.userType === 'admin'
      ? [`${base}/api/admins/${encodeURIComponent(qrData.userId)}`, `${base}/api/students/${encodeURIComponent(qrData.userId)}`]
      : [`${base}/api/students/${encodeURIComponent(qrData.userId)}`, `${base}/api/admins/${encodeURIComponent(qrData.userId)}`];
    let backendUser: any = null;
    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (res.ok) { backendUser = await res.json(); break; }
      } catch {}
    }
    if (!backendUser) {
      // Fallback to local mock DB if backend user not found or DB is down
      let local = databaseService.authenticateWithQRCode(qrData);
      if (!local.success || !local.user) {
        // Optional auto-provision (dev): create a local user from QR to prevent "User not found"
        const enableAutoProvision = String((import.meta as any)?.env?.VITE_QR_AUTOPROVISION ?? 'true').toLowerCase() !== 'false';
        if (enableAutoProvision) {
          const provision = databaseService.upsertUserFromQR(qrData);
          if (provision.success && provision.user) {
            local = databaseService.authenticateWithQRCode(qrData);
          }
        }
      }
      if (!local.success || !local.user) {
        throw new Error(local.error || 'User not found');
      }
      const dbUser = local.user;
      const session: AuthUser = {
        ...dbUser,
        role: (dbUser.userType as UserRole),
        authKey: dbUser.twoFactorKey,
      } as AuthUser;
      const token = `jwt.${btoa(`${session.id}.${Date.now()}`)}`;
      localStorage.setItem('token', token);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      setUser(session);
      try { ActivityService.log(session.id, 'login', 'QR_fallback'); } catch {}
      console.log(`✅ User authenticated via QR (fallback): ${session.fullName} (${session.id})`);
      return;
    }

    // Build session from backend user
    const resolvedRole: UserRole = (backendUser.role || backendUser.userType || (qrData.userType as UserRole)) as UserRole;
    const session: AuthUser = {
      ...(backendUser || {}),
      id: backendUser.id || backendUser.studentId || backendUser.adminId || qrData.userId,
      role: resolvedRole,
      authKey: backendUser.twoFactorKey || backendUser.twoFactorSetupKey,
      fullName: backendUser.fullName || [backendUser.lastName, backendUser.firstName, backendUser.middleName].filter(Boolean).join(', ')
    } as AuthUser;

    const token = `jwt.${btoa(`${session.id}.${Date.now()}`)}`;
    localStorage.setItem('token', token);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setUser(session);

    try { ActivityService.log(session.id, 'login', 'QR'); } catch {}
    console.log(`✅ User authenticated via QR: ${session.fullName} (${session.id})`);
  };


  const enableTwoFactor = (authKey: string) => {
    if (!user) return;
    const normalized = (authKey || '').toString().replace(/\s+/g, '').toUpperCase();
    // Persist to database for accuracy across sessions
    const dbUpdate = databaseService.updateUser(user.id, { twoFactorEnabled: true, twoFactorKey: normalized });
    try {
      const base = API.BACKEND.BASE;
      fetch(`${base}/api/users/` + encodeURIComponent(user.id) + '/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: true, secret: normalized }) });
    } catch {}
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
    try {
      const base = API.BACKEND.BASE;
      fetch(`${base}/api/users/` + encodeURIComponent(user.id) + '/2fa', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: false }) });
    } catch {}
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
      const base = API.BACKEND.BASE;
      fetch(`${base}/2fa/verify`, {
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


