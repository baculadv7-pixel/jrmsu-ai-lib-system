import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, QrCode, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { pythonApi } from "@/services/pythonApi";
import { QRCodeSVG } from "qrcode.react";

interface Admin2FAOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  userEmail?: string;
  onEnabledChange?: (enabled: boolean) => void;
}

export default function Admin2FAOverlay({ isOpen, onClose, userId, userName, userEmail, onEnabledChange }: Admin2FAOverlayProps) {
  const { toast } = useToast();
  const [secret, setSecret] = useState<string>("");
  const [otpauth, setOtpauth] = useState<string>("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("http://localhost:5000/2fa/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account: userEmail || userId, issuer: "JRMSU-LIBRARY" })
        });
        const j = await r.json();
        setSecret(j.secret);
        setOtpauth(j.otpauth || j.otpauth_url || j.otpauthUri || j.otpauth);
      } catch (e) {
        toast({ title: "Failed to initialize 2FA", variant: "destructive" });
      } finally { setLoading(false); }
    })();
  }, [isOpen, userId, userEmail, toast]);

  const verifyAndEnable = async () => {
    if (!secret || code.length !== 6) return;
    setLoading(true);
    try {
      // Verify via backend
      const ok = await pythonApi.verifyTotp(secret, code);
      if (!ok) { toast({ title: "Invalid code", variant: "destructive" }); return; }
      // Persist enable for target user
      await pythonApi.toggle2FA(userId, true, secret);
      toast({ title: "2FA enabled", description: `${userName || userId} now has 2FA enabled.` });
      onEnabledChange?.(true);
      onClose();
    } catch (e: any) {
      toast({ title: "Enable failed", description: e?.message || "", variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Configure 2FA for {userName || userId}. Scan the QR code and enter the 6-digit code to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Card className="shadow-jrmsu">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Authentication & 2FA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="p-4 bg-white border rounded-lg">
                  {otpauth ? (
                    <QRCodeSVG value={otpauth} size={200} level="H" includeMargin={true} />
                  ) : (
                    <div className="h-[200px] w-[200px] flex items-center justify-center text-muted-foreground">
                      <QrCode className="h-6 w-6 mr-2" /> Generating...
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Authenticator Code</Label>
                <Input inputMode="numeric" maxLength={6} placeholder="123456" value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} />
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">Account: {userEmail || userId}</Badge>
                <Button onClick={verifyAndEnable} disabled={loading || code.length!==6} className="gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Confirm Enable
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
