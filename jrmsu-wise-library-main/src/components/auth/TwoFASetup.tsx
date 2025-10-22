import { useState, useEffect } from "react";
import { Shield, Smartphone, Key, Copy, RefreshCw, CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import * as OTPAuth from 'otpauth';
import { verifyTotpToken, currentTotpCode } from '@/utils/totp';
import { pythonApi } from '@/services/pythonApi';
import { databaseService } from '@/services/database';

interface TwoFactorData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  isEnabled: boolean;
  setupComplete: boolean;
}

interface TwoFASetupProps {
  onSetupComplete?: (data: TwoFactorData) => void;
  onToggle?: (enabled: boolean) => void;
  requirePasswordVerification?: boolean;
}

export default function TwoFASetup({ 
  onSetupComplete, 
  onToggle,
  requirePasswordVerification = true 
}: TwoFASetupProps = {}) {
  const { user, enableTwoFactor, disableTwoFactor } = useAuth();
  const { toast } = useToast();
  
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [password, setPassword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [currentAuthCode, setCurrentAuthCode] = useState("");
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  // Disable 2FA form state
  const [disablePw, setDisablePw] = useState("");
  const [disablePw2, setDisablePw2] = useState("");
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const disableValid = disablePw.length > 0 && disablePw === disablePw2;

  // Generate real current auth code from user's saved secret
  useEffect(() => {
    if (!user?.twoFactorEnabled || !user?.authKey) return;
    const updateAuthCode = () => {
      const code = currentTotpCode(user.authKey!);
      setCurrentAuthCode(code || "");
    };
    updateAuthCode();
    const interval = setInterval(updateAuthCode, 1000);
    return () => clearInterval(interval);
  }, [user?.twoFactorEnabled, user?.authKey]);

  // Generate 2FA setup data
  const generateTwoFactorSetup = async (): Promise<TwoFactorData> => {
    // Generate a Base32 secret (browser‑safe); otplib keyuri will encode correctly
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    const secret = Array.from({ length: 32 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    
    const serviceName = "JRMSU Library";
    const accountName = user?.id || "user";
    const issuer = "JRMSU-LIBRARY";
    
    // Generate standard TOTP URL using OTPAuth
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromB32(secret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      label: accountName,
      issuer,
    });
    const otpauthUrl = totp.toString();
    
    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => {
      const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `${part1}-${part2}`;
    });

    return {
      secret,
      qrCodeUrl: otpauthUrl,
      backupCodes,
      isEnabled: false,
      setupComplete: false
    };
  };

  const handleGenerateSetup = async () => {
    setIsGenerating(true);
    try {
      let setupData: TwoFactorData | null = null;
      // Try Python API first for consistent secrets/URIs
      const ok = await pythonApi.health();
      if (ok) {
        const resp = await fetch('http://127.0.0.1:5001/2fa/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: user?.id || 'user', issuer: 'JRMSU-LIBRARY' })
        });
        if (resp.ok) {
          const j = await resp.json();
          setupData = {
            secret: j.secret,
            qrCodeUrl: j.otpauth,
            backupCodes: Array.from({ length: 10 }, () => {
              const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
              const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
              return `${part1}-${part2}`;
            }),
            isEnabled: false,
            setupComplete: false,
          };
        }
      }
      if (!setupData) {
        // Fallback to local generator
        setupData = await generateTwoFactorSetup();
      }
      setTwoFactorData(setupData);
      setShowSetup(true);
      toast({
        title: "2FA setup generated",
        description: "Scan the QR code with Google Authenticator"
      });
    } catch (error) {
      toast({
        title: "Setup failed",
        description: "Failed to generate 2FA setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!twoFactorData || !verificationCode) {
      toast({
        title: "Verification required",
        description: "Please enter the 6-digit code from your authenticator app.",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      // Verify with Python API first, fallback to local
      let ok = await pythonApi.verifyTotp(twoFactorData.secret, verificationCode);
      if (!ok) {
        ok = verifyTotpToken(twoFactorData.secret, verificationCode, [10, 10]);
      }
      if (!ok) throw new Error('Invalid code');

      enableTwoFactor(twoFactorData.secret);
      
      const completedSetup = {
        ...twoFactorData,
        isEnabled: true,
        setupComplete: true
      };
      
      setTwoFactorData(completedSetup);
      setShowBackupCodes(true);
      
      if (onSetupComplete) {
        onSetupComplete(completedSetup);
      }
      
      toast({
        title: "2FA enabled successfully",
        description: "Two-factor authentication is now active on your account."
      });
      
      setVerificationCode("");
      setShowSetup(false);
    } catch (error) {
      toast({
        title: "Verification failed",
        description: "Invalid verification code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (enabled) {
      // Enable 2FA - generate setup
      await handleGenerateSetup();
    } else {
      // Show disable form; actual disable happens on button click after password match
      setShowSetup(false);
    }
  };

  const handleRegenerateSetup = async () => {
    if (!user?.twoFactorEnabled) {
      toast({
        title: "Regeneration not allowed",
        description: "2FA must be disabled before regenerating setup keys.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const newSetupData = await generateTwoFactorSetup();
      setTwoFactorData(newSetupData);
      setShowSetup(true);
      
      toast({
        title: "2FA setup regenerated",
        description: "A new setup key has been generated. You'll need to reconfigure your authenticator app."
      });
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: "Failed to regenerate 2FA setup. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copied`,
      description: "Copied to clipboard"
    });
  };

  const downloadBackupCodes = () => {
    if (!twoFactorData?.backupCodes) return;
    
    const content = [
      "JRMSU Library - Two-Factor Authentication Backup Codes",
      "Generated: " + new Date().toLocaleString(),
      "User: " + (user?.id || "Unknown"),
      "",
      "Keep these backup codes safe. Each code can only be used once.",
      "Use these codes if you lose access to your authenticator app.",
      "",
      ...twoFactorData.backupCodes.map((code, index) => `${index + 1}. ${code}`)
    ].join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jrmsu-2fa-backup-codes-${user?.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Backup codes downloaded",
      description: "Save this file in a secure location"
    });
  };

  return (
    <div className="space-y-6">
      {/* 2FA Status Card */}
      <Card className="shadow-jrmsu border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Two-Factor Authentication
            </div>
            <Badge variant={user?.twoFactorEnabled ? "default" : "secondary"}>
              {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Add an extra layer of security with Google Authenticator or similar app
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Enable 2FA Protection</p>
                <p className="text-sm text-muted-foreground">
                  Add extra security with Google Authenticator
                </p>
              </div>
            </div>
            <Switch
              checked={user?.twoFactorEnabled || false}
              onCheckedChange={handleToggle2FA}
            />
          </div>

          {/* When enabled: require password + confirm to disable */}
          {user?.twoFactorEnabled && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <p className="font-medium">Disable 2FA</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative">
                  <Label>Enter Password</Label>
                  <Input
                    type={showPw1 ? 'text' : 'password'}
                    value={disablePw}
                    onChange={(e) => setDisablePw(e.target.value)}
                    placeholder="Enter your password"
                  />
<button type="button" className="absolute right-3 bottom-2 text-muted-foreground" onClick={() => setShowPw1(!showPw1)}>
                    {showPw1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="relative">
                  <Label>Confirm Password</Label>
                  <Input
                    type={showPw2 ? 'text' : 'password'}
                    value={disablePw2}
                    onChange={(e) => setDisablePw2(e.target.value)}
                    placeholder="Re-enter your password"
                  />
<button type="button" className="absolute right-3 bottom-2 text-muted-foreground" onClick={() => setShowPw2(!showPw2)}>
                    {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  disabled={!disableValid}
                  onClick={() => {
                    if (!user) return;
                    const ok = databaseService.verifyUserPassword(user.id, disablePw);
                    if (!ok) {
                      toast({ title: 'Password incorrect', description: 'Please check your password and try again.', variant: 'destructive' });
                      return;
                    }
                    disableTwoFactor();
                    setTwoFactorData(null);
                    setDisablePw('');
                    setDisablePw2('');
                    toast({ title: '2FA disabled', description: 'Two-factor authentication has been disabled.' });
                    if (onToggle) onToggle(false);
                  }}
                >
                  Disable 2FA
                </Button>
              </div>
            </div>
          )}

          {/* Password verification for disabling */}
          {!user?.twoFactorEnabled && requirePasswordVerification && (
            <div className="space-y-2">
              <Label>Password (required to disable 2FA)</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!user?.twoFactorEnabled ? (
              <Button 
                onClick={() => handleToggle2FA(true)}
                disabled={isGenerating}
                className="flex-1"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isGenerating ? "Generating..." : "Setup 2FA"}
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={handleRegenerateSetup}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate Setup
                </Button>
                {twoFactorData?.backupCodes && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowBackupCodes(true)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Backup Codes
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with Google Authenticator or similar app
            </DialogDescription>
          </DialogHeader>

          {twoFactorData && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <QRCodeSVG
                  value={twoFactorData.qrCodeUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Manual Entry */}
              <div className="space-y-2">
                <Label>Manual Entry Key:</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={twoFactorData.secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(twoFactorData.secret, "Secret key")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Verification Code Input */}
              <div className="space-y-2">
                <Label>Enter 6-digit code from your app:</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  className="text-center font-mono text-lg"
                  maxLength={6}
                />
              </div>

              {/* Verify Button */}
              <Button 
                onClick={handleVerifyAndEnable}
                disabled={verificationCode.length !== 6 || isVerifying}
                className="w-full"
              >
                <Shield className="h-4 w-4 mr-2" />
                {isVerifying ? "Verifying..." : "Verify & Enable 2FA"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Backup Codes</DialogTitle>
            <DialogDescription>
              Save these codes in a secure place. Each can only be used once.
            </DialogDescription>
          </DialogHeader>

          {twoFactorData?.backupCodes && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Store these codes safely. You'll need them if you lose access to your authenticator app.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {twoFactorData.backupCodes.map((code, index) => (
                  <div key={index} className="font-mono text-sm text-center p-2 bg-background rounded">
                    {code}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={downloadBackupCodes}
                  className="flex-1"
                >
                  Download Codes
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => copyToClipboard(twoFactorData.backupCodes.join('\n'), "Backup codes")}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


