import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { NotificationManager } from "@/services/notificationManager";

export interface LibrarySession {
  sessionId: string;
  userId: string;
  userType: 'student' | 'admin';
  fullName: string;
  loginTime: Date;
  logoutTime?: Date;
  status: 'active' | 'logged_out';
  hasReservations: boolean;
  hasBorrowedBooks: boolean;
  reservedBooks?: any[];
  borrowedBooks?: any[];
  loginMethod?: 'manual' | 'qr';
}

interface LibrarySessionContextValue {
  session: LibrarySession | null;
  createSession: (userId: string, userType: 'student' | 'admin', fullName: string, loginMethod?: 'manual' | 'qr') => Promise<void>;
  endSession: () => Promise<void>;
  checkUserStatus: (userId: string) => Promise<{ hasReservations: boolean; hasBorrowedBooks: boolean; reservedBooks: any[]; borrowedBooks: any[] }>;
  borrowBook: (bookId: string) => Promise<void>;
  returnBook: (bookId: string) => Promise<void>;
  cancelReservation: (bookId: string) => Promise<void>;
  activateReturnTime: (bookId: string) => Promise<void>;
}

const LibrarySessionContext = createContext<LibrarySessionContextValue | undefined>(undefined);

const API_BASE = 'http://localhost:5000';

export function LibrarySessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [session, setSession] = useState<LibrarySession | null>(null);

  // Load active session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('library_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setSession({
          ...parsed,
          loginTime: new Date(parsed.loginTime),
          logoutTime: parsed.logoutTime ? new Date(parsed.logoutTime) : undefined
        });
      } catch (error) {
        console.error('Failed to parse saved session:', error);
        localStorage.removeItem('library_session');
      }
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem('library_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('library_session');
    }
  }, [session]);

  const createSession = async (userId: string, userType: 'student' | 'admin', fullName: string, loginMethod: 'manual' | 'qr' = 'manual') => {
    try {
      const response = await fetch(`${API_BASE}/api/library/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, userType, fullName })
      });

      if (!response.ok) {
        throw new Error('Failed to create library session');
      }

      const data = await response.json();
      
      const newSession: LibrarySession = {
        sessionId: data.sessionId,
        userId,
        userType,
        fullName,
        loginTime: new Date(),
        status: 'active',
        hasReservations: data.hasReservations || false,
        hasBorrowedBooks: data.hasBorrowedBooks || false,
        reservedBooks: data.reservedBooks || [],
        borrowedBooks: data.borrowedBooks || [],
        loginMethod
      };

      setSession(newSession);
      console.log('✅ Library session created:', newSession);
      
      // Send notification to all admins
      if (loginMethod === 'manual') {
        await NotificationManager.libraryLoginManual(userId, fullName, userType);
      } else {
        await NotificationManager.libraryLoginQR(userId, fullName, userType);
      }
    } catch (error) {
      console.error('❌ Failed to create library session:', error);
      throw error;
    }
  };

  const endSession = async () => {
    if (!session) return;

    try {
      const response = await fetch(`${API_BASE}/api/library/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.sessionId, userId: session.userId })
      });

      if (!response.ok) {
        throw new Error('Failed to end library session');
      }

      // Send notification to all admins
      const loginMethod = session.loginMethod || 'manual';
      if (loginMethod === 'manual') {
        await NotificationManager.libraryLogoutManual(session.userId, session.fullName, session.userType);
      } else {
        await NotificationManager.libraryLogoutQR(session.userId, session.fullName, session.userType);
      }

      setSession(null);
      console.log('✅ Library session ended');
    } catch (error) {
      console.error('❌ Failed to end library session:', error);
      throw error;
    }
  };

  const checkUserStatus = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/library/user-status/${encodeURIComponent(userId)}`);
      
      if (!response.ok) {
        throw new Error('Failed to check user status');
      }

      const data = await response.json();
      return {
        hasReservations: data.hasReservations || false,
        hasBorrowedBooks: data.hasBorrowedBooks || false,
        reservedBooks: data.reservedBooks || [],
        borrowedBooks: data.borrowedBooks || []
      };
    } catch (error) {
      console.error('❌ Failed to check user status:', error);
      return {
        hasReservations: false,
        hasBorrowedBooks: false,
        reservedBooks: [],
        borrowedBooks: []
      };
    }
  };

  const borrowBook = async (bookId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/library/borrow-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session?.userId, 
          bookId,
          sessionId: session?.sessionId 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to borrow book');
      }

      console.log('✅ Book borrowed successfully');
    } catch (error) {
      console.error('❌ Failed to borrow book:', error);
      throw error;
    }
  };

  const returnBook = async (bookId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/library/return-book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session?.userId, 
          bookId,
          sessionId: session?.sessionId 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to return book');
      }

      console.log('✅ Book returned successfully');
    } catch (error) {
      console.error('❌ Failed to return book:', error);
      throw error;
    }
  };

  const cancelReservation = async (bookId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/library/cancel-reservation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session?.userId, 
          bookId,
          sessionId: session?.sessionId 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel reservation');
      }

      console.log('✅ Reservation cancelled successfully');
    } catch (error) {
      console.error('❌ Failed to cancel reservation:', error);
      throw error;
    }
  };

  const activateReturnTime = async (bookId: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/library/activate-return-time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session?.userId, 
          bookId,
          sessionId: session?.sessionId 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to activate return time');
      }

      console.log('✅ Return time activated successfully');
    } catch (error) {
      console.error('❌ Failed to activate return time:', error);
      throw error;
    }
  };

  const value: LibrarySessionContextValue = {
    session,
    createSession,
    endSession,
    checkUserStatus,
    borrowBook,
    returnBook,
    cancelReservation,
    activateReturnTime
  };

  return (
    <LibrarySessionContext.Provider value={value}>
      {children}
    </LibrarySessionContext.Provider>
  );
}

export function useLibrarySession(): LibrarySessionContextValue {
  const context = useContext(LibrarySessionContext);
  if (!context) {
    throw new Error('useLibrarySession must be used within LibrarySessionProvider');
  }
  return context;
}
