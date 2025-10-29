import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { databaseService } from "@/services/database";
import { ActivityService } from "@/services/activity";
import { NotificationsService } from "@/services/notifications";
import { NotificationManager } from "@/services/notificationManager";
import { useAuth } from "@/context/AuthContext";
import { AuthResetService } from "@/services/authReset";

export function ForgotPasswordOverlayBody({ onDone, initialId }: { onDone?: () => void; initialId?: string }) {
  const { toast } = useToast();
  const { verifyTotp } = useAuth();
  type Method = "email" | "admin" | "2fa";
  const [method, setMethod] = useState<Method>("email");

  // Identity (auto-filled but editable)
  const [userId, setUserId] = useState(initialId || "");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  // Email flow state
  const [codeSent, setCodeSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<number>(0);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA
  const [totp, setTotp] = useState("");

  // Admin request rate limit
  const [adminCooldown, setAdminCooldown] = useState(0);
  const [adminBlockedOpen, setAdminBlockedOpen] = useState(false);

  const ADMIN_ATTEMPTS_KEY = "jrmsu_pw_admin_req";
  function readAdminAttempts(emailAddr: string): { count: number; blockUntil?: number } {
    try {
      const data = JSON.parse(localStorage.getItem(ADMIN_ATTEMPTS_KEY) || "{}");
      return data[emailAddr.toLowerCase()] || { count: 0 };
    } catch { return { count: 0 }; }
  }
  function writeAdminAttempts(emailAddr: string, rec: { count: number; blockUntil?: number }) {
    try {
      const data = JSON.parse(localStorage.getItem(ADMIN_ATTEMPTS_KEY) || "{}");
      data[emailAddr.toLowerCase()] = rec;
      localStorage.setItem(ADMIN_ATTEMPTS_KEY, JSON.stringify(data));
    } catch {}
  }

  // Prefill by ID (if known)
  useEffect(() => {
    const tryHydrate = () => {
      const id = (userId || initialId || "").trim();
      if (!id) return;
      const u = databaseService.getUserById(id);
      if (u) {
        setFullName(u.fullName);
        setEmail(u.email);
        setTwoFAEnabled(Boolean(u.twoFactorEnabled));
      }
    };
    tryHydrate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, initialId]);

  const canReset = useMemo(() => verified && newPw.length >= 8 && newPw === confirmPw, [verified, newPw, confirmPw]);

// Server-driven; no local code storage/read

  // Cooldown ticker (email)
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = cooldown;
    const t = setInterval(() => {
      cooldownRef.current -= 1;
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Cooldown ticker (admin)
  useEffect(() => {
    if (adminCooldown <= 0) return;
    const t = setInterval(() => setAdminCooldown((p)=> (p>0? p-1: 0)), 1000);
    return () => clearInterval(t);
  }, [adminCooldown]);

  async function sendResetCode() {
    const u = userId ? databaseService.getUserById(userId) : email ? databaseService.getUserByEmail(email.trim()) : null;
    if (!u) { toast({ title: "User not found", description: "Enter a valid ID or email.", variant: "destructive" }); return; }
    // Sync identity fields
    setUserId(u.id); setFullName(u.fullName); setEmail(u.email); setTwoFAEnabled(Boolean(u.twoFactorEnabled));
    // UX: start cooldown immediately after tap to prevent spamming
    setCodeSent(true);
    setCooldown(60);
    try {
      await AuthResetService.requestResetByEmail({ userId: u.id, email: u.email, fullName: u.fullName });
      ActivityService.log(u.id, 'password_reset_email_requested');
      toast({ title: "Reset code sent", description: "Check your inbox for the code." });
    } catch (e: any) {
      toast({ title: "Failed to send code", description: e?.message || "", variant: "destructive" });
    }
  }

  async function verifyCode() {
    try {
      await AuthResetService.verifyCode({ email: email.trim(), code });
      setVerified(true);
      const u = userId ? databaseService.getUserById(userId) : email ? databaseService.getUserByEmail(email.trim()) : null;
      if (u) ActivityService.log(u.id, 'password_reset_email_verified');
      toast({ title: "Code verified" });
    } catch (e: any) {
      toast({ title: "Invalid or expired code", description: e?.message || '', variant: 'destructive' });
    }
  }

  async function requestAdminReset() {
    const u = userId ? databaseService.getUserById(userId) : email ? databaseService.getUserByEmail(email.trim()) : null;
    if (!u) { toast({ title: "User not found", variant: "destructive" }); return; }

    // Check block state (5-minute block after 5 attempts)
    const rec = readAdminAttempts(u.email);
    const now = Date.now();
    if (rec.blockUntil && now < rec.blockUntil) {
      const remain = Math.ceil((rec.blockUntil - now) / 1000);
      setAdminCooldown(remain);
      setAdminBlockedOpen(true);
      return;
    }
    if (adminCooldown > 0) return;

    // UX: start cooldown immediately after tap
    setAdminCooldown(60);
    try {
      await AuthResetService.requestResetByAdmin({ userId: u.id, email: u.email, fullName: u.fullName });
      
      // Send notification to ALL admins using NotificationManager
      NotificationManager.passwordResetRequest(u.id, u.fullName, u.email);
      
      // Increment attempts
      const nextCount = (rec.count || 0) + 1;
      const next: { count: number; blockUntil?: number } = { count: nextCount };
      if (nextCount >= 5) {
        next.blockUntil = now + 5 * 60 * 1000; // 5 minutes block
        setAdminBlockedOpen(true);
        setAdminCooldown(Math.ceil((next.blockUntil - now)/1000));
      }
      writeAdminAttempts(u.email, next);
      toast({ title: "Request sent", description: nextCount >=5 ? "Admin appears busy. Try again after 5 minutes." : "An administrator will review your request." });
    } catch (e: any) {
      toast({ title: "Failed to send request", description: e?.message || '', variant: 'destructive' });
    }
  }

  async function verifyTotpCode() {
    const u = userId ? databaseService.getUserById(userId) : email ? databaseService.getUserByEmail(email.trim()) : null;
    if (!u) { toast({ title: "User not found", variant: "destructive" }); return; }
    if (!u.twoFactorEnabled) { toast({ title: "2FA not enabled", variant: "destructive" }); return; }
    // Try python local first, fallback to verifyTotp
    let ok = false;
    try {
      if (u.twoFactorKey) {
        const r = await fetch('http://localhost:5000/2fa/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ secret: u.twoFactorKey, token: totp, window: 5 }) });
        ok = r.ok && Boolean((await r.json())?.valid);
      }
    } catch {}
    if (!ok) ok = verifyTotp(totp);
    if (!ok) { toast({ title: 'Invalid or expired 2FA code', variant: 'destructive' }); return; }
    setVerified(true);
    ActivityService.log(u.id, 'password_reset_2fa_verified');
    toast({ title: '2FA verified' });
  }

  async function resetPassword() {
    if (!canReset) return;
    setLoading(true);
    try {
      await AuthResetService.resetPassword({ userId, email: email.trim(), code, newPassword: newPw });
      const u = userId ? databaseService.getUserById(userId) : email ? databaseService.getUserByEmail(email.trim()) : null;
      if (u) {
        // Also update local DB for immediate app sync
        databaseService.setUserPassword(u.id, newPw);
        ActivityService.log(u.id, `password_reset_${method}`);
        NotificationsService.add({ receiverId: u.id, type: 'system', message: 'Your password was reset successfully.' });
      }
      toast({ title: "Password reset", description: "You can now log in with your new password." });
      onDone?.();
    } catch (e: any) {
      toast({ title: 'Reset failed', description: e?.message || '', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
    <Card className="shadow-jrmsu">
      <CardHeader>
        <CardTitle>Forgot Password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Identity */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1"><Label htmlFor="fp-id">User ID</Label><Input id="fp-id" value={userId} onChange={(e)=>setUserId(e.target.value)} placeholder="KCL-00045 or KC-23-A-00243" /></div>
          <div className="space-y-1"><Label htmlFor="fp-name">Full Name</Label><Input id="fp-name" value={fullName} onChange={(e)=>setFullName(e.target.value)} placeholder="Full Name" /></div>
          <div className="space-y-1"><Label htmlFor="fp-email">Email</Label><Input id="fp-email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@jrmsu.edu.ph" /></div>
        </div>

        {/* Method selector */}
        <div className="flex flex-wrap gap-2">
          <Button variant={method === "email" ? "default" : "outline"} onClick={() => setMethod("email")}>Email Verification</Button>
          <Button variant={method === "admin" ? "default" : "outline"} onClick={() => setMethod("admin")}>Message the Admin</Button>
          <Button variant={twoFAEnabled ? (method === "2fa" ? "default" : "outline") : "outline"} disabled={!twoFAEnabled} onClick={() => twoFAEnabled && setMethod("2fa")}>Use 2FA Code</Button>
        </div>

        {method === "email" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {!codeSent && (
                <Button onClick={sendResetCode} disabled={cooldown>0}>Send Reset Code{cooldown>0?` (in ${String(Math.floor(cooldown/60)).padStart(2,'0')}:${String(cooldown%60).padStart(2,'0')})`:''}</Button>
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
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Send a reset request to administrators. You will be notified once approved.</p>
            {!verified ? (
              <Button onClick={requestAdminReset} disabled={adminCooldown>0}>
                {adminCooldown>0 ? `Request Password Reset (in ${String(Math.floor(adminCooldown/60)).padStart(2,'0')}:${String(adminCooldown%60).padStart(2,'0')})` : 'Request Password Reset'}
              </Button>
            ) : (
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

        {method === "2fa" && (
          <div className="space-y-3">
            {!verified ? (
              <div className="space-y-2">
                <Label htmlFor="fp-totp">2FA Code</Label>
                <Input id="fp-totp" inputMode="numeric" maxLength={6} placeholder="123456" value={totp} onChange={(e)=>setTotp(e.target.value.replace(/\D/g,'').slice(0,6))} />
                <Button onClick={verifyTotpCode} disabled={totp.length!==6}>Verify 2FA Code</Button>
              </div>
            ) : (
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
      </CardContent>
    </Card>

    {/* Admin busy overlay */}
    <Dialog open={adminBlockedOpen} onOpenChange={setAdminBlockedOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Admin is busy</DialogTitle>
          <DialogDescription>
            Sorry any inconveniance! But it seems the admin its busy right now, try again after 5 minutes.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          {adminCooldown>0 && <p>Retry available in {String(Math.floor(adminCooldown/60)).padStart(2,'0')}:{String(adminCooldown%60).padStart(2,'0')}.</p>}
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
