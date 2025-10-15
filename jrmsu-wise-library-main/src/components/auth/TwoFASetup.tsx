import { useMemo, useState } from "react";
import { authenticator } from "otplib";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import QRCodeDisplay from "@/components/qr/QRCodeDisplay";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function TwoFASetup() {
  const { user, enableTwoFactor, verifyTotp } = useAuth();
  const { toast } = useToast();
  const [token, setToken] = useState("");

  const secret = useMemo(() => authenticator.generateSecret(), []);
  const otpauth = useMemo(() => {
    const label = encodeURIComponent(`JRMSU:${user?.id ?? "user"}`);
    return authenticator.keyuri(label, "JRMSU Library", secret);
  }, [secret, user?.id]);

  const handleVerify = () => {
    const isValid = authenticator.verify({ token, secret });
    if (!isValid) {
      toast({ title: "Invalid code", description: "Please try again.", variant: "destructive" });
      return;
    }
    enableTwoFactor(secret);
    toast({ title: "2FA enabled", description: "Two-factor authentication is now active." });
  };

  return (
    <Card className="shadow-jrmsu">
      <CardHeader>
        <CardTitle>Set up Authenticator App</CardTitle>
        <CardDescription>Scan the QR with Google Authenticator or similar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <QRCodeDisplay data={otpauth} />
          <div className="space-y-2">
            <Label htmlFor="code">Enter 6-digit code</Label>
            <Input id="code" inputMode="numeric" maxLength={6} value={token} onChange={(e) => setToken(e.target.value)} />
            <Button onClick={handleVerify} className="mt-2">Verify & Enable</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


