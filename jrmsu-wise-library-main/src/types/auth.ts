export type UserRole = "admin" | "student";

export interface User {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  role: UserRole;
  profilePicture?: string;
  // Admin specific
  adminId?: string;
  position?: string;
  // Student specific
  studentId?: string;
  department?: string;
  course?: string;
  yearLevel?: string;
  block?: string;
  // 2FA
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: Date;
  read: boolean;
  userId: string;
}