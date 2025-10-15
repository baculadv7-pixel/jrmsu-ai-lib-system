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

const Login = () => {
  const navigate = useNavigate();
  const { signIn, verifyTotp } = useAuth();
  const { toast } = useToast();
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
      // If 2FA is enabled, require TOTP
      const needsTotp = loginMethod === "manual" && userType && localStorage.getItem("jrmsu_auth_session");
      if (needsTotp) {
        try {
          const session = JSON.parse(localStorage.getItem("jrmsu_auth_session") || "null");
          if (session?.twoFactorEnabled) {
            // rudimentary flow: ask for TOTP before navigating
            if (!formData.totp) {
              toast({ title: "Enter TOTP code", description: "Two-factor code required.", variant: "destructive" });
              return;
            }
            const ok = verifyTotp(formData.totp);
            if (!ok) {
              toast({ title: "Invalid 2FA code", description: "Please try again.", variant: "destructive" });
              return;
            }
          }
        } catch {}
      }
      navigate("/dashboard");
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
          {/* User Type Toggle */}
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

          {/* Login Method Selection */}
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

              {/* Conditional TOTP field */}
              {is2FAEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="totp">2FA Code</Label>
                  <Input
                    id="totp"
                    inputMode="numeric"
                    placeholder="123456"
                    value={formData.totp}
                    onChange={(e) => setFormData({ ...formData, totp: e.target.value })}
                    aria-label="Two-factor authentication code"
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <a href="#" className="text-primary hover:underline">
                  Forgot Password?
                </a>
              </div>

              <Button type="submit" className="w-full">
                Login
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Don’t have an account? <a href="/register" className="text-primary hover:underline">Register here</a>
              </p>
            </form>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-48 w-48 bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Scan your QR code to login
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
