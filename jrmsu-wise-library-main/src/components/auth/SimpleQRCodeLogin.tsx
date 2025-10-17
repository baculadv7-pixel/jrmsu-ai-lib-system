import { useState, useCallback } from "react";
import { Camera, ArrowLeft, CheckCircle, Shield, AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { validateJRMSUQRCode } from "@/components/qr/StableQRCode";
import { BasicQRScanner } from "@/components/auth/BasicQRScanner";

interface QRCodeLoginProps {
  onBackToManual: () => void;
  onLoginSuccess: () => void;
}

interface QRLoginData {
  fullName: string;
  userId: string;
  userType: "admin" | "student";
  authCode: string;
  encryptedToken: string;
  twoFactorKey?: string;
  timestamp: number;
  systemId: "JRMSU-LIBRARY";
}

export function SimpleQRCodeLogin({ onBackToManual, onLoginSuccess }: QRCodeLoginProps) {
  const { signIn, verifyTotp } = useAuth();
  const { toast } = useToast();
  
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<QRLoginData | null>(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Handle detected QR code with enhanced error handling
  const handleQRDetected = useCallback(async (qrData: string) => {
    console.log('🎯 QR Code detected:', qrData);
    
    try {
      const validation = validateJRMSUQRCode(qrData);
      
      if (!validation.isValid) {
        setScanError(validation.error || "Invalid QR Code");
        toast({
          title: "⚠️ Invalid QR Code",
          description: validation.error || "Please scan a valid JRMSU Library System QR Code.",
          variant: "destructive"
        });
        
        // Auto-clear error after 3 seconds to continue scanning
        setTimeout(() => {
          setScanError(null);
        }, 3000);
        return;
      }
      
      const loginData = validation.data as QRLoginData;
      setScannedData(loginData);
      setScanError(null);
      
      console.log('✅ Valid QR code processed:', {
        userId: loginData.userId,
        userType: loginData.userType,
        has2FA: !!loginData.twoFactorKey
      });
      
      // Check if 2FA is required
      if (loginData.twoFactorKey) {
        setRequires2FA(true);
        toast({
          title: "✅ QR Code Scanned Successfully",
          description: "Two-factor authentication required to complete login."
        });
      } else {
        // Proceed with login
        await proceedWithLogin(loginData);
      }
      
    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanError("Failed to process QR code");
      toast({
        title: "Processing Error",
        description: "Failed to process the QR code. Please try scanning again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Proceed with login using QR data
  const proceedWithLogin = async (loginData: QRLoginData, totpCode?: string) => {
    setIsLoggingIn(true);
    
    try {
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock login with QR data - in production, verify encrypted token server-side
      await signIn({ 
        id: loginData.userId, 
        password: "qr-login", // Special flag for QR login
        role: loginData.userType 
      });
      
      // Log successful login for audit trail
      const loginLog = {
        userId: loginData.userId,
        fullName: loginData.fullName,
        timestamp: new Date().toISOString(),
        method: "QR_CODE",
        deviceInfo: navigator.userAgent,
        success: true,
        twoFactorUsed: !!loginData.twoFactorKey
      };
      
      // In production, send this to your logging API
      console.log("QR Login recorded:", loginLog);
      
      // If 2FA is required, verify TOTP
      if (loginData.twoFactorKey && totpCode) {
        const isValidTotp = verifyTotp(totpCode);
        if (!isValidTotp) {
          throw new Error("Invalid 2FA code. Please try again.");
        }
      }
      
      toast({
        title: "✅ Login Successful!",
        description: `Redirecting to your dashboard...`,
        duration: 2000
      });
      
      // Small delay for user to see success message
      setTimeout(() => {
        onLoginSuccess();
      }, 1500);
      
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message || "QR Code authentication failed. Please try again.",
        variant: "destructive"
      });
      
      // Reset state
      setScannedData(null);
      setRequires2FA(false);
      setTwoFactorCode("");
      
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle 2FA submission
  const handle2FASubmit = async () => {
    if (!scannedData || !twoFactorCode || twoFactorCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit 2FA code.",
        variant: "destructive"
      });
      return;
    }
    
    await proceedWithLogin(scannedData, twoFactorCode);
  };

  // Reset scanner with enhanced state management
  const resetScanner = useCallback(() => {
    console.log('🔄 Resetting scanner state...');
    setScannedData(null);
    setRequires2FA(false);
    setTwoFactorCode("");
    setScanError(null);
    setIsInitializing(false);
  }, []);

  // Handle scanner errors with user-friendly messages
  const handleScanError = useCallback((error: string) => {
    console.error('Scanner error:', error);
    
    // Provide user-friendly error messages
    let userMessage = error;
    if (error.includes('permission')) {
      userMessage = 'Camera permission denied. Please allow camera access to use QR login.';
    } else if (error.includes('not found') || error.includes('no camera')) {
      userMessage = 'No camera found. Please ensure your device has a working camera.';
    } else if (error.includes('timeout')) {
      userMessage = 'Scanner initialization timed out. Please try again.';
    }
    
    setScanError(userMessage);
    setIsInitializing(false);
  }, []);

  // 2FA Screen
  if (requires2FA) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBackToManual}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manual Login
          </Button>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold">QR Code Verified</h3>
                <p className="text-muted-foreground">
                  Welcome, {scannedData?.fullName}
                </p>
                <Badge variant="outline" className="mt-2">
                  {scannedData?.userType === "admin" ? "Administrator" : "Student"} • {scannedData?.userId}
                </Badge>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Two-factor authentication is enabled on your account. Please enter your 6-digit code to complete login.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>2FA Authentication Code</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg font-mono"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the code from your Google Authenticator app
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={resetScanner}
                  className="flex-1"
                >
                  Scan Again
                </Button>
                <Button 
                  onClick={handle2FASubmit}
                  disabled={twoFactorCode.length !== 6 || isLoggingIn}
                  className="flex-1"
                >
                  {isLoggingIn ? "Verifying..." : "Complete Login"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main QR Scanner Screen
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBackToManual}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Manual Login
        </Button>
        <Badge variant="outline">QR Login Mode</Badge>
      </div>

      {/* Instructions */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Camera className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">QR Code Login</h3>
              <p className="text-sm text-blue-700">
                Use your camera to scan your JRMSU Library System QR code for quick login.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Camera Scanner with Error Handling */}
      <BasicQRScanner 
        onScanSuccess={handleQRDetected}
        onError={handleScanError}
      />

      {/* Error Display */}
      {scanError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{scanError}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setScanError(null)}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {scannedData && !requires2FA && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">QR Code scanned successfully!</p>
              <div className="text-sm">
                <p><strong>User:</strong> {scannedData.fullName}</p>
                <p><strong>ID:</strong> {scannedData.userId}</p>
                <p><strong>Type:</strong> {scannedData.userType}</p>
              </div>
              {isLoggingIn && <p className="text-sm text-muted-foreground">Logging you in...</p>}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm space-y-2">
            <p className="font-medium">📋 How to use QR Login:</p>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
              <li>Click "Start QR Scanner" to activate your camera</li>
              <li>Grant camera permission when prompted by your browser</li>
              <li>Position your JRMSU Library QR code clearly in the camera frame</li>
              <li>The system will automatically detect and validate your QR code</li>
              <li>For demo purposes, you can use the "Simulate Scan" button when the camera is active</li>
              <li>If you have 2FA enabled, you'll need to enter your authenticator code after scanning</li>
              <li>Make sure your QR code is well-lit and not blurry for best results</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}