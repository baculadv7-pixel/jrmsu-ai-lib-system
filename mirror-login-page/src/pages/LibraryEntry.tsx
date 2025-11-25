import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, QrCode, CheckCircle } from "lucide-react";
import { io } from "socket.io-client";
import logo from "@/assets/jrmsu-logo.jpg";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { QRCodeLogin } from "@/components/auth/QRCodeLogin";
import { WelcomeMessage, useWelcomeMessage } from "@/components/auth/WelcomeMessage";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ForgotPasswordOverlayBody } from "@/components/auth/ForgotPasswordOverlay";
// Library-specific imports
import { useLibrarySession } from "@/context/LibrarySessionContext";
import { API } from "@/config/api";
import { 
  BookPickupDialog, 
  BookReturnDialog, 
  BookScannerDialog,
  LogoutBookScan,
  BorrowReturnPromptDialog,
} from "@/components/library";

import { ActiveSessionsPanel } from "@/components/sessions/ActiveSessionsPanel";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, verifyTotp, user } = useAuth();
  const { toast } = useToast();
  const { isVisible, userData, showWelcome, hideWelcome } = useWelcomeMessage();
  // Library session management
  const { session, createSession, checkUserStatus, checkUserSessionStatus, borrowBook, returnBook, endSession } = useLibrarySession();
  const [showPassword, setShowPassword] = useState(false);
  const [isUserLoggedInLibrary, setIsUserLoggedInLibrary] = useState(false);
  const [userType, setUserType] = useState<"student" | "admin">("student");
  const [loginMethod, setLoginMethod] = useState<"manual" | "qr">("manual");
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    totp: "",
  });
  const [idTouched, setIdTouched] = useState(false);
  const authSession = (() => {
    try {
      return JSON.parse(localStorage.getItem("jrmsu_auth_session") || "null");
    } catch { return null; }
  })();
  const is2FAEnabled = Boolean(authSession?.twoFactorEnabled);
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [showRestartOverlay, setShowRestartOverlay] = useState(false);
  
  // Library-specific state
  const [showBookPickup, setShowBookPickup] = useState(false);
  const [showBookReturn, setShowBookReturn] = useState(false);
  const [showBookScanner, setShowBookScanner] = useState(false);
  const [showLogoutScan, setShowLogoutScan] = useState(false);
  const [scannerMode, setScannerMode] = useState<'borrow' | 'return'>('borrow');
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [userBorrowedBooks, setUserBorrowedBooks] = useState<any[]>([]);
  const [currentBookToScan, setCurrentBookToScan] = useState<string | null>(null);
  const [logoutAfterScan, setLogoutAfterScan] = useState(false);
  const [showBorrowPrompt, setShowBorrowPrompt] = useState(false);
  const [showReturnPrompt, setShowReturnPrompt] = useState(false);

  // Listen for backend session cleanup (restart/shutdown) and show overlay
  useEffect(() => {
    const BASE = API.BACKEND.BASE;
    const s = io(BASE, { transports: ['websocket','polling'], withCredentials: true, reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 500 });
    s.on('session_cleanup', () => {
      try { localStorage.setItem('session_cleanup_ts', String(Math.floor(Date.now()/1000))); } catch {}
      setShowRestartOverlay(true);
    });
    return () => { s.close(); };
  }, []);

  // Show overlay if recent cleanup detected on load
  useEffect(() => {
    try {
      const ts = Number(localStorage.getItem('session_cleanup_ts') || '0');
      if (ts && (Math.floor(Date.now()/1000) - ts) < 1800) {
        setShowRestartOverlay(true);
      }
    } catch {}
  }, []);

  // When the shared library session context becomes null (any logout source),
  // ensure our local "isUserLoggedInLibrary" flag is also cleared so the banner disappears.
  useEffect(() => {
    if (!session) {
      setIsUserLoggedInLibrary(false);
    }
  }, [session]);

  // Check if the SPECIFIC typed user ID has an active library session
  useEffect(() => {
    const checkTypedUserSession = async () => {
      // If no ID is typed yet, show blue LOGIN button
      if (!formData.id || formData.id.trim() === '') {
        // no-op: avoid noisy console logs
        setIsUserLoggedInLibrary(false);
        return;
      }

      // First check local session from context
      if (session && session.status === 'active' && session.userId === formData.id) {
        // no-op
        setIsUserLoggedInLibrary(true);
        return;
      }

      // Also check localStorage directly (in case context hasn't updated yet)
      try {
        const savedSession = localStorage.getItem('library_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed.status === 'active' && parsed.userId === formData.id) {
            // no-op
            setIsUserLoggedInLibrary(true);
            return;
          }
        }
      } catch (e) {
        console.error('Error checking localStorage session:', e);
      }

      // Then check backend for this specific user
      try {
        const hasActiveSession = await checkUserSessionStatus(formData.id);
        if (hasActiveSession) {
          // no-op
          setIsUserLoggedInLibrary(true);
        } else {
          // no-op
          setIsUserLoggedInLibrary(false);
        }
      } catch (error) {
        console.error('Error checking session status:', error);
        setIsUserLoggedInLibrary(false);
      }
    };

    checkTypedUserSession();
  }, [session, formData.id, checkUserSessionStatus]);

  const adminIdRegex = /^KCL-\d{5}$/;
  const studentIdRegex = /^KC-\d{2}-[A-D]-\d{5}$/; // enforce exactly 5 digits at the end

  const trailingDigitsCount = (value: string) => {
    const last = (value.split("-").pop() || "").match(/\d+/);
    return last ? last[0].length : 0;
  };

  const shouldShowIdError = () => {
    const invalid = userType === "admin" ? !adminIdRegex.test(formData.id) : !studentIdRegex.test(formData.id);
    const lastDigitsComplete = trailingDigitsCount(formData.id) >= 5;
    return invalid && (idTouched || lastDigitsComplete);
  };

  const sanitize = (value: string) => value.replace(/\s+/g, "").toUpperCase();
  const enforceStudentPrefix = (value: string) => {
    const v = sanitize(value);
    if (!v.startsWith("KC-")) return `KC-${v.replace(/^KC-?/, "")}`;
    return v;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate IDs according to role
      if (userType === "admin") {
        if (!adminIdRegex.test(formData.id)) {
          toast({ title: "Invalid Admin ID", description: "⚠️ Invalid ID format. Please follow the correct format.", variant: "destructive" });
          return;
        }
      } else {
        if (!studentIdRegex.test(formData.id)) {
          toast({ title: "Invalid Student ID", description: "⚠️ Invalid ID format. Please follow the correct format.", variant: "destructive" });
          return;
        }
      }
      await signIn({ id: formData.id, password: formData.password, role: userType });
      
      // After signIn, re-check session for 2FA and show code request card if enabled
      const updatedSession = JSON.parse(localStorage.getItem("jrmsu_auth_session") || "null");
      if (loginMethod === "manual" && updatedSession?.twoFactorEnabled) {
        setTwoFARequired(true);
        setTwoFACode("");
        return; // wait for 2FA verification before proceeding
      }
      
      // Proceed when 2FA not required
      const firstName = updatedSession?.firstName || "User";
      const fullName = updatedSession?.fullName || firstName;
      
      // Create library session
      try {
        await createSession(formData.id, userType, fullName, 'manual');
        console.log('✅ Library session created');
        
        // Check for reservations and borrowed books
        const status = await checkUserStatus(formData.id);
        setUserReservations(status.reservedBooks || []);
        setUserBorrowedBooks(status.borrowedBooks || []);
        
        // Show welcome message first
        showWelcome(firstName, userType);
        
        // After welcome message (2 seconds), check for book actions
        setTimeout(() => {
          if (status.hasReservations && status.reservedBooks.length > 0) {
            setShowBookPickup(true);
          } else if (status.hasBorrowedBooks && status.borrowedBooks.length > 0) {
            setShowBookReturn(true);
          }
        }, 2500);
        
      } catch (libErr: any) {
        console.error('❌ Library session error:', libErr);
        // Continue with login even if library session fails
        showWelcome(firstName, userType);
      }
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.message ?? "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  // Library dialog handlers
  const handleBookPickupYes = () => {
    setShowBookPickup(false);
    setScannerMode('borrow');
    setShowBookScanner(true);
  };

  const handleBookPickupNo = () => {
    setShowBookPickup(false);
    toast({
      title: "Noted",
      description: "You can scan the book when you pick it up during logout.",
      variant: "default"
    });
    // If this dialog was shown as part of logout flow, continue logout without borrowing
    if (logoutAfterScan) {
      setLogoutAfterScan(false);
      void handleLogoutComplete();
    }
  };

  const handleBookReturnYes = () => {
    setShowBookReturn(false);
    setScannerMode('return');
    setShowBookScanner(true);
  };

  const handleBookReturnNo = () => {
    setShowBookReturn(false);
    toast({
      title: "Noted",
      description: "You can return the book later.",
      variant: "default"
    });
    // If this dialog was shown as part of logout flow, continue logout without returning
    if (logoutAfterScan) {
      setLogoutAfterScan(false);
      void handleLogoutComplete();
    }
  };

  const [lastScannedBookId, setLastScannedBookId] = useState<string | null>(null);
  const [showBorrowSuccessOverlay, setShowBorrowSuccessOverlay] = useState(false);
  const [showReturnSuccessOverlay, setShowReturnSuccessOverlay] = useState(false);

  const handleBookScanned = async (bookId: string) => {
    try {
      setLastScannedBookId(bookId);

      if (scannerMode === 'borrow') {
        await borrowBook(bookId);
        // Second-stage overlay: show full-screen success card after backend confirms borrow
        setShowBorrowSuccessOverlay(true);
        toast({
          title: "Book Borrowed",
          description: "BOOK SUCCESSFUL BORROWED. Admins have been notified.",
          variant: "default"
        });
      } else {
        await returnBook(bookId);
        setShowReturnSuccessOverlay(true);
        toast({
          title: "Book Returned",
          description: "BOOK SUCCESSFUL RETURN. Admins have been notified.",
          variant: "default"
        });
      }

      setShowBookScanner(false);
      setCurrentBookToScan(null);

      // If this scan was initiated from a logout flow, complete logout after successful borrow/return
      if (logoutAfterScan) {
        setLogoutAfterScan(false);
        void handleLogoutComplete();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process book",
        variant: "destructive"
      });
    }
  };

  const handleLogoutComplete = async () => {
    try {
      // Get user info before ending session
      const firstName = session?.fullName?.split(' ')[0] || "User";
      const userType = session?.userType || "student";
      
      await endSession();
      
      // Show logout success message (similar to welcome message)
      showWelcome(firstName, userType, "logout");
      
      setShowLogoutScan(false);
      // Clear form and reset state
      setFormData({ id: "", password: "", totp: "" });
      // Explicitly mark that the user no longer has an active library session on this client
      setIsUserLoggedInLibrary(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to logout",
        variant: "destructive"
      });
    }
  };

  const handleLibraryLogout = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use the best available userId for status checks: prefer active
    // library session, then authenticated user, then typed ID.
    const activeUserId = session?.userId || user?.id || formData.id;
    if (!activeUserId) {
      // Nothing to check; just complete logout locally.
      await handleLogoutComplete();
      return;
    }

    try {
      // Refresh user status from backend to see latest reservations/borrows
      const status = await checkUserStatus(activeUserId);
      setUserReservations(status.reservedBooks || []);
      setUserBorrowedBooks(status.borrowedBooks || []);

      console.log('📊 Library logout status check:', {
        userId: activeUserId,
        hasReservations: status.hasReservations,
        reservedCount: status.reservedBooks?.length ?? 0,
        hasBorrowedBooks: status.hasBorrowedBooks,
        borrowedCount: status.borrowedBooks?.length ?? 0,
      });

      // If user has reserved books, ask to scan to borrow before logout.
      // Be defensive: rely on the actual reservedBooks list, not just the flag.
      if ((status.hasReservations || (status.reservedBooks?.length ?? 0) > 0) &&
          (status.reservedBooks?.length ?? 0) > 0) {
        setLogoutAfterScan(true);
        setShowBorrowPrompt(true);
        return;
      }

      // If user has borrowed books, ask to scan to return before logout.
      if ((status.hasBorrowedBooks || (status.borrowedBooks?.length ?? 0) > 0) &&
          (status.borrowedBooks?.length ?? 0) > 0) {
        setLogoutAfterScan(true);
        setShowReturnPrompt(true);
        return;
      }

      // No reserved or borrowed books: direct logout
      await handleLogoutComplete();
    } catch (error: any) {
      console.error('❌ Library logout status check failed:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to check library status before logout.",
        variant: "destructive",
      });
      // Fallback: still attempt logout so user is not stuck
      await handleLogoutComplete();
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-12 gap-4">
        {/* Left: Active Sessions */}
        <div className="col-span-12 lg:col-span-4 order-2 lg:order-1">
          <ActiveSessionsPanel 
            currentUserId={session?.userId || user?.id || null}
            onLogoutCurrentUser={async () => {
              // Reuse the same logout flow as the green "Logout from Library" button,
              // so borrow/return overlays can run before ending the session.
              const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
              await handleLibraryLogout(fakeEvent);
            }}
          />
        </div>
        {/* Right: Existing login content */}
        <div className="col-span-12 lg:col-span-8 order-1 lg:order-2">
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-jrmsu">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logo} alt="JRMSU Logo" className="h-24 w-24 object-contain" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              JRMSU AI-Library System
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Jose Rizal Memorial State University
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Type Toggle - Hide during QR login */}
          {loginMethod === "manual" && (
            <Tabs
              value={userType}
              onValueChange={(v) => {
                const role = v as "student" | "admin";
                setUserType(role);
                setFormData((prev) => ({
                  ...prev,
                  id: role === "student" ? (prev.id || "KC-") : (prev.id || "KCL-"),
                }));
                setIdTouched(false);
              }}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Login Method Selection - Always show both buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={loginMethod === "manual" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setLoginMethod("manual")}
            >
              Manual Login
            </Button>
            <Button
              type="button"
              variant={loginMethod === "qr" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setLoginMethod("qr")}
            >
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
          </div>

          {/* Login Form */}
          {loginMethod === "manual" ? (
            <form onSubmit={handleLogin} className="space-y-4" aria-label="Login form">
              <div className="space-y-2">
                <Label htmlFor="id">{userType === "student" ? "Student ID" : "Admin ID"}</Label>
                  <Input
                  id="id"
                  placeholder={userType === "student" ? "KC-23-A-00243" : "KCL-00045"}
                  value={formData.id}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const cleaned = sanitize(raw);
                    const next = userType === "student" ? enforceStudentPrefix(cleaned) : cleaned;
                    setFormData({ ...formData, id: next });
                    
                    // Check if this specific user has an active session
                    // This will trigger the useEffect to update button state
                  }}
                  onBlur={() => setIdTouched(true)}
                  required
                    aria-describedby="id-help id-error"
                  className={shouldShowIdError() ? "border-destructive" : undefined}
                />
                  {shouldShowIdError() && (
                    <p id="id-error" className="text-xs text-destructive">⚠️ Invalid ID format. Please follow the correct format.</p>
                  )}
                  {userType === "admin" ? (
                    <p id="id-help" className="text-xs text-muted-foreground">Admin ID format: KCL-00045</p>
                  ) : (
                    <p id="id-help" className="text-xs text-muted-foreground">Student ID format: KC-23-A-00243</p>
                  )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    aria-describedby="password-help"
                  />
                  <p id="password-help" className="sr-only">Password field with toggle visibility</p>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-smooth"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Removed inline TOTP input to avoid duplicate 2FA UI; 2FA handled via dialog after login */}

              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setForgotOpen(true)} className="text-primary hover:underline">
                  Forgot Password?
                </button>
              </div>

              {/* Debug: Show current session status */}
              {session && session.status === 'active' && isUserLoggedInLibrary && (
                <div className="text-xs text-center p-2 bg-green-50 border border-green-200 rounded-md">
                  <span className="text-green-700 font-medium">
                    ✓ Library Session Active: {session.userId}
                  </span>
                </div>
              )}

              {isUserLoggedInLibrary ? (
                <Button 
                  type="button" 
                  onClick={handleLibraryLogout} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Logout from Library
                </Button>
              ) : (
                <Button type="submit" className="w-full">
                  Login to Library
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Don’t have an account? <a
                  href={"http://localhost:8080/register?returnTo=" + encodeURIComponent("http://localhost:8081/")}
                  className="text-primary hover:underline"
                >Register here</a>
              </p>
            </form>
          ) : (
            <QRCodeLogin 
              onBackToManual={() => setLoginMethod("manual")}
              onLoginSuccess={() => {
                // Redirect handled by QRCodeLogin after welcome message
                navigate("/dashboard");
              }}
              onBeginLogoutFlow={async () => {
                // Reuse the same logout flow used by the manual "Logout from Library" button.
                const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                await handleLibraryLogout(fakeEvent);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* System restart overlay */}
      <Dialog open={showRestartOverlay} onOpenChange={setShowRestartOverlay}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>System Notice</DialogTitle>
            <DialogDescription>
              Sorry, the system was restarted (power outage or maintenance). All active sessions were safely logged out. Please log in again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={()=> setShowRestartOverlay(false)}>OK</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Overlay */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>Reset your password using email verification, admin request, or 2FA.</DialogDescription>
          </DialogHeader>
          <ForgotPasswordOverlayBody initialId={formData.id} onDone={() => setForgotOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* 2FA Authentication Code Request Card */}
      <Dialog open={twoFARequired} onOpenChange={setTwoFARequired}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from your Google Authenticator app to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totp-code">2FA Code</Label>
              <Input
                id="totp-code"
                inputMode="numeric"
                placeholder="123456"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0,6))}
                className="text-center font-mono text-lg"
                maxLength={6}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setTwoFARequired(false)}>Cancel</Button>
              <Button
                className="flex-1"
                disabled={twoFACode.length !== 6}
                onClick={async () => {
                  // Try Python verification with latest session secret first
                  const session = (() => { try { return JSON.parse(localStorage.getItem("jrmsu_auth_session") || "null"); } catch { return null; } })();
                  const secret = (session?.authKey || session?.twoFactorKey || '').toString();
                  let ok = false;
                  try {
                    if (secret) {
                      const r = await fetch('http://localhost:5000/2fa/verify', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ secret, token: twoFACode, window: 5 })
                      });
                      ok = r.ok && Boolean((await r.json())?.valid);
                    }
                  } catch {}
                  if (!ok) ok = verifyTotp(twoFACode);
                  if (!ok) {
                    toast({ title: "Invalid 2FA code", description: "Please try again.", variant: "destructive" });
                    return;
                  }
                  setTwoFARequired(false);
                  const updatedSession = JSON.parse(localStorage.getItem("jrmsu_auth_session") || "null");
                  const firstName = updatedSession?.firstName || "User";
                  showWelcome(firstName, userType);
                }}
              >
                Verify & Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Message Overlay for manual login */}
      {userData && (
        <WelcomeMessage
          firstName={userData.firstName}
          userRole={userData.userRole}
          isVisible={isVisible}
          mode={userData.mode || "login"}
          onComplete={() => {
            hideWelcome();
            // Don't navigate - stay on library entry page
          }}
          duration={1500}
        />
      )}

      {/* Entry-time library dialogs for when user first logs in */}
      <BookPickupDialog
        open={showBookPickup}
        onOpenChange={setShowBookPickup}
        userName={user?.fullName || user?.firstName || "User"}
        reservedBooks={userReservations}
        onYes={handleBookPickupYes}
        onNo={handleBookPickupNo}
      />

      <BookReturnDialog
        open={showBookReturn}
        onOpenChange={setShowBookReturn}
        userName={user?.fullName || user?.firstName || "User"}
        borrowedBooks={userBorrowedBooks}
        onYes={handleBookReturnYes}
        onNo={handleBookReturnNo}
      />

      {/* Logout-time borrow/return prompts that lead into the Book Scanner */}
      <BorrowReturnPromptDialog
        open={showBorrowPrompt}
        mode="borrow"
        userName={user?.fullName || user?.firstName || "User"}
        reservedCount={userReservations.length}
        borrowedCount={userBorrowedBooks.length}
        onConfirm={() => {
          setShowBorrowPrompt(false);
          setScannerMode('borrow');
          setShowBookScanner(true);
        }}
        onCancel={() => {
          setShowBorrowPrompt(false);
          if (logoutAfterScan) {
            setLogoutAfterScan(false);
            void handleLogoutComplete();
          }
        }}
      />

      <BorrowReturnPromptDialog
        open={showReturnPrompt}
        mode="return"
        userName={user?.fullName || user?.firstName || "User"}
        reservedCount={userReservations.length}
        borrowedCount={userBorrowedBooks.length}
        onConfirm={() => {
          setShowReturnPrompt(false);
          setScannerMode('return');
          setShowBookScanner(true);
        }}
        onCancel={() => {
          setShowReturnPrompt(false);
          if (logoutAfterScan) {
            setLogoutAfterScan(false);
            void handleLogoutComplete();
          }
        }}
      />

      <BookScannerDialog
        open={showBookScanner}
        onOpenChange={setShowBookScanner}
        mode={scannerMode}
        onScanSuccess={handleBookScanned}
        showCancelReservation={scannerMode === 'borrow'}
      />

      <LogoutBookScan
        open={showLogoutScan}
        onOpenChange={setShowLogoutScan}
        borrowedBooks={userBorrowedBooks}
        onComplete={handleLogoutComplete}
      />

      {/* Second-stage overlay cards for successful borrow/return after QR detection */}
      <Dialog open={showBorrowSuccessOverlay} onOpenChange={setShowBorrowSuccessOverlay}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">SUCCESSFULLY BORROW</DialogTitle>
            <DialogDescription className="text-center">
              BOOK SUCCESSFUL BORROWED {lastScannedBookId ? `(Book ID: ${lastScannedBookId})` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="relative h-20 w-20">
              {/* Spinning ring */}
              <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              {/* Solid circle with check */}
              <div className="absolute inset-3 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              You may proceed to use the book. This action has been recorded in the library system.
            </p>
            <Button onClick={() => setShowBorrowSuccessOverlay(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showReturnSuccessOverlay} onOpenChange={setShowReturnSuccessOverlay}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">SUCCESSFULLY RETURN</DialogTitle>
            <DialogDescription className="text-center">
              BOOK SUCCESSFUL RETURN {lastScannedBookId ? `(Book ID: ${lastScannedBookId})` : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="relative h-20 w-20">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-300 border-t-emerald-600 animate-spin" />
              <div className="absolute inset-3 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              The book has been returned and marked available in the inventory.
            </p>
            <Button onClick={() => setShowReturnSuccessOverlay(false)} className="w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
