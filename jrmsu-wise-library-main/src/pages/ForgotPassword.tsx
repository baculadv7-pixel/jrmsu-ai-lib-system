import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { databaseService } from "@/services/database";

export default function ForgotPassword() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userType: "student" | "admin" = (user?.role as any) || "student";

  type Method = "email" | "admin" | "2fa";
  const [method, setMethod] = useState<Method>("email");

  // Email flow state
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);

  const canReset = useMemo(() => verified && newPw.length >= 8 && newPw === confirmPw, [verified, newPw, confirmPw]);

  function storeCode(email: string, code: string) {
    const key = "jrmsu_pw_reset_codes";
    try {
      const now = Date.now();
      const expiresAt = now + 10 * 60 * 1000; // 10 minutes
      const raw = localStorage.getItem(key);
      const data = raw ? JSON.parse(raw) : {};
      data[email.toLowerCase()] = { code, expiresAt };
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }

  function readCode(email: string): { code: string; expiresAt: number } | null {
    try {
      const data = JSON.parse(localStorage.getItem("jrmsu_pw_reset_codes") || "{}");
      return data[email.toLowerCase()] || null;
    } catch { return null; }
  }

  async function sendResetCode() {
    if (!email.trim()) {
      toast({ title: "Enter your registered email", variant: "destructive" });
      return;
    }
    const user = databaseService.getUserByEmail(email.trim());
    if (!user) {
      toast({ title: "Email not found", description: "Please check the email address.", variant: "destructive" });
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    storeCode(email.trim(), code);
    setCodeSent(true);
    toast({ title: "Reset code sent", description: "Check your inbox (simulated in dev)." });
  }

  async function verifyCode() {
    const rec = readCode(email.trim());
    if (!rec) { toast({ title: "No code was sent", variant: "destructive" }); return; }
    if (Date.now() > rec.expiresAt) { toast({ title: "Code expired", variant: "destructive" }); return; }
    if (code !== rec.code) { toast({ title: "Invalid code", variant: "destructive" }); return; }
    setVerified(true);
    toast({ title: "Code verified" });
  }

  async function resetPassword() {
    if (!canReset) return;
    setLoading(true);
    try {
      const u = databaseService.getUserByEmail(email.trim());
      if (!u) { toast({ title: "User not found", variant: "destructive" }); return; }
      const res = databaseService.setUserPassword(u.id, newPw);
      if (!res.success) { toast({ title: "Failed to reset", description: res.error, variant: "destructive" }); return; }
      toast({ title: "Password reset", description: "You can now log in with your new password." });
      // Optionally redirect to login
      window.location.href = "/";
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      <div className="flex">
        <Sidebar userType={userType} />
        <main className="flex-1 p-6">
          <div className="w-[95vw] md:w-[70vw] lg:w-[55vw] xl:w-[960px] mx-auto">
            <Card className="shadow-jrmsu">
              <CardHeader>
                <CardTitle>Forgot Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Method selector */}
                <div className="flex flex-wrap gap-2">
                  <Button variant={method === "email" ? "default" : "outline"} onClick={() => setMethod("email")}>Email Verification</Button>
                  <Button variant={method === "admin" ? "default" : "outline"} onClick={() => setMethod("admin")}>Message the Admin</Button>
                  <Button variant={method === "2fa" ? "default" : "outline"} onClick={() => setMethod("2fa")}>Use 2FA Code</Button>
                </div>

                {method === "email" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fp-email">Registered Email</Label>
                      <Input id="fp-email" type="email" placeholder="you@jrmsu.edu.ph" value={email} onChange={(e)=>setEmail(e.target.value)} />
                      {!codeSent && (
                        <Button onClick={sendResetCode}>Send Reset Code</Button>
                      )}
                    </div>

                    {codeSent && !verified && (
                      <div className="space-y-2">
                        <Label htmlFor="fp-code">Verification Code</Label>
                        <Input id="fp-code" inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} />
                        <Button onClick={verifyCode} disabled={code.length!==6}>Verify Code</Button>
                      </div>
                    )}

                    {verified && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="new-pw">New Password (min 8)</Label>
                          <Input id="new-pw" type="password" value={newPw} onChange={(e)=>setNewPw(e.target.value)} />
                        </div>
                        <div>
                          <Label htmlFor="confirm-pw">Confirm Password</Label>
                          <Input id="confirm-pw" type="password" value={confirmPw} onChange={(e)=>setConfirmPw(e.target.value)} />
                        </div>
                        <Button onClick={resetPassword} disabled={!canReset || loading}>{loading?"Resetting...":"Reset Password"}</Button>
                      </div>
                    )}
                  </div>
                )}

                {method === "admin" && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>This will send a reset request to the administrator for approval. Once approved, you can set a new password.</p>
                    <p>Implementation note: hook to NotificationsService for admin approval, then reveal password form.</p>
                  </div>
                )}

                {method === "2fa" && (
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Enter your 2FA code to verify your identity, then set a new password.</p>
                    <p>Implementation note: verify via backend or local TOTP utils, then reveal password form.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
