import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, QrCode } from "lucide-react";
import logo from "@/assets/jrmsu-logo.jpg";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { QRCodeLogin } from "@/components/auth/QRCodeLogin";
import { WelcomeMessage, useWelcomeMessage } from "@/components/auth/WelcomeMessage";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ForgotPasswordOverlayBody } from "@/components/auth/ForgotPasswordOverlay";
// Library-specific imports
import { useLibrarySession } from "@/context/LibrarySessionContext";
import { 
  BookPickupDialog, 
  BookReturnDialog, 
  BookScannerDialog,
  LogoutBookScan 
} from "@/components/library";

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
  
  // Library-specific state
  const [showBookPickup, setShowBookPickup] = useState(false);
  const [showBookReturn, setShowBookReturn] = useState(false);
  const [showBookScanner, setShowBookScanner] = useState(false);
  const [showLogoutScan, setShowLogoutScan] = useState(false);
  const [scannerMode, setScannerMode] = useState<'borrow' | 'return'>('borrow');
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [userBorrowedBooks, setUserBorrowedBooks] = useState<any[]>([]);
  const [currentBookToScan, setCurrentBookToScan] = useState<string | null>(null);

  // Check if the SPECIFIC typed user ID has an active library session
  useEffect(() => {
    const checkTypedUserSession = async () => {
      // If no ID is typed yet, show blue LOGIN button
      if (!formData.id || formData.id.trim() === '') {
        console.log('❌ No ID typed - showing blue LOGIN button');
        setIsUserLoggedInLibrary(false);
        return;
      }

      // First check local session from context
      if (session && session.status === 'active' && session.userId === formData.id) {
        console.log('✅ Typed ID matches local active session (context) - showing green LOGOUT button');
        setIsUserLoggedInLibrary(true);
        return;
      }

      // Also check localStorage directly (in case context hasn't updated yet)
      try {
        const savedSession = localStorage.getItem('library_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed.status === 'active' && parsed.userId === formData.id) {
            console.log('✅ Typed ID matches local active session (localStorage) - showing green LOGOUT button');
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
          console.log('✅ Typed ID has active session (backend) - showing green LOGOUT button');
          setIsUserLoggedInLibrary(true);
        } else {
          console.log('❌ Typed ID has no active session - showing blue LOGIN button');
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
  };

  const handleBookScanned = async (bookId: string) => {
    try {
      if (scannerMode === 'borrow') {
        await borrowBook(bookId);
        toast({
          title: "Success",
          description: "Book borrowed successfully! Admins have been notified.",
          variant: "default"
        });
      } else {
        await returnBook(bookId);
        toast({
          title: "Success",
          description: "Book returned successfully! Admins have been notified.",
          variant: "default"
        });
      }
      setShowBookScanner(false);
      setCurrentBookToScan(null);
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
      // Note: isUserLoggedInLibrary will be automatically updated by useEffect when session changes
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
    
    // Check if user has borrowed books that need scanning
    if (session && session.hasBorrowedBooks && session.borrowedBooks && session.borrowedBooks.length > 0) {
      setShowLogoutScan(true);
    } else {
      // Direct logout if no borrowed books
      await handleLogoutComplete();
    }
  };

  return (
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
              {session && session.status === 'active' && (
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
                Don’t have an account? <a href="http://localhost:8080/register" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Register here</a>
              </p>
            </form>
          ) : (
            <QRCodeLogin 
              onBackToManual={() => setLoginMethod("manual")}
              onLoginSuccess={() => {
                // Redirect handled by QRCodeLogin after welcome message
                navigate("/dashboard");
              }}
            />
          )}
        </CardContent>
      </Card>

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

      {/* Library-specific dialogs */}
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
    </div>
  );
};

export default Login;
