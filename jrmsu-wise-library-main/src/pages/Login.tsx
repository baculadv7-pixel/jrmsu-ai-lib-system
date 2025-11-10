import { useState } from "react";
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

const Login = () => {
  const navigate = useNavigate();
  const { signIn, verifyTotp, user } = useAuth();
  const { toast } = useToast();
  const { isVisible, userData, showWelcome, hideWelcome } = useWelcomeMessage();
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<"student" | "admin">("student");
  const [loginMethod, setLoginMethod] = useState<"manual" | "qr">("manual");
  const [formData, setFormData] = useState({
    id: "",
    password: "",
    totp: "",
  });
  const [idTouched, setIdTouched] = useState(false);
  const session = (() => {
    try {
      return JSON.parse(localStorage.getItem("jrmsu_auth_session") || "null");
    } catch { return null; }
  })();
  const is2FAEnabled = Boolean(session?.twoFactorEnabled);
  const [twoFARequired, setTwoFARequired] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);

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
      showWelcome(firstName, userType);
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err?.message ?? "Please check your credentials and try again.",
        variant: "destructive",
      });
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

              <Button type="submit" className="w-full">
                Login
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Don’t have an account? <a href="/register" className="text-primary hover:underline">Register here</a>
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
          onComplete={() => {
            hideWelcome();
            navigate("/dashboard");
          }}
          duration={1500}
        />
      )}
    </div>
  );
};

export default Login;
