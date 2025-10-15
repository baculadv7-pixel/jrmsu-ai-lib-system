import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authenticator } from "otplib";

export type UserRole = "student" | "admin";

export interface AuthUser {
  id: string; // Student ID or Admin ID
  role: UserRole;
  twoFactorEnabled?: boolean;
  authKey?: string; // TOTP secret
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (params: { id: string; password: string; role: UserRole }) => Promise<void>;
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
    // Client-side placeholder auth. Replace with Supabase/Backend later.
    if (!id || !password) {
      throw new Error("ID and password are required");
    }
    if (role === "admin" && !/^KCL-\d{5}$/.test(id)) {
      throw new Error("Admin ID must match KCL-00000 format");
    }
    const session: AuthUser = { id, role };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    setUser(session);
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const enableTwoFactor = (authKey: string) => {
    if (!user) return;
    const updated: AuthUser = { ...user, twoFactorEnabled: true, authKey };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  const disableTwoFactor = () => {
    if (!user) return;
    const updated: AuthUser = { ...user, twoFactorEnabled: false, authKey: undefined };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    setUser(updated);
  };

  const verifyTotp = (token: string): boolean => {
    if (!user?.twoFactorEnabled || !user?.authKey) return false;
    try {
      return authenticator.verify({ token, secret: user.authKey });
    } catch {
      return false;
    }
  };

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: Boolean(user),
    signIn,
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


