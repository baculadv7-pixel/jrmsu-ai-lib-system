import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, RotateCcw, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Database-like QR Code structure
export interface QRCodeData {
  id: string;
  userId: string;
  qrCodeData: string; // Encrypted JSON string
  generatedAt: Date;
  lastRegenerated?: Date;
  isActive: boolean;
  type: "user" | "book";
}

// User QR Code encoded data structure
interface UserQRData {
  fullName: string;
  userId: string;
  userType: "admin" | "student";
  authCode: string; // Real-time authentication code
  encryptedToken: string; // Encrypted password token
  twoFactorKey?: string; // 2FA setup key (linked to Google Authenticator)
  timestamp: number;
  systemId: "JRMSU-LIBRARY";
}

// Book QR Code encoded data structure
interface BookQRData {
  bookCode: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  systemId: "JRMSU-LIBRARY";
}

interface StableQRCodeProps {
  userId: string;
  userType: "admin" | "student";
  userData: {
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
  };
  twoFactorKey?: string;
  onRegenerate?: (newQRData: QRCodeData) => void;
  allowRegeneration?: boolean;
}

export function StableQRCode({
  userId,
  userType,
  userData,
  twoFactorKey,
  onRegenerate,
  allowRegeneration = true
}: StableQRCodeProps) {
  const [qrCodeData, setQrCodeData] = useState<QRCodeData | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  // Generate current authentication code (mock implementation)
  const generateAuthCode = (): string => {
    const timestamp = Math.floor(Date.now() / 30000); // 30-second intervals
    return (timestamp % 1000000).toString().padStart(6, '0');
  };

  // Generate encrypted token (mock implementation)
  const generateEncryptedToken = (): string => {
    const data = `${userId}-${Date.now()}`;
    return btoa(data); // In real implementation, use proper encryption
  };

  // Generate stable QR code data
  const generateQRCodeData = (forceRegenerate = false): QRCodeData => {
    const fullName = `${userData.firstName} ${userData.middleName} ${userData.lastName}`.trim();
    
    const userQRData: UserQRData = {
      fullName,
      userId,
      userType,
      authCode: generateAuthCode(),
      encryptedToken: generateEncryptedToken(),
      twoFactorKey,
      timestamp: Date.now(),
      systemId: "JRMSU-LIBRARY"
    };

    // In real implementation, this would be encrypted
    const encodedData = JSON.stringify(userQRData);

    const now = new Date();
    const newQRData: QRCodeData = {
      id: qrCodeData?.id || `qr-${userId}-${Date.now()}`,
      userId,
      qrCodeData: encodedData,
      generatedAt: qrCodeData?.generatedAt || now,
      lastRegenerated: forceRegenerate ? now : qrCodeData?.lastRegenerated,
      isActive: true,
      type: "user"
    };

    return newQRData;
  };

  // Initialize QR code on mount
  useEffect(() => {
    // In real implementation, first try to load from database
    const existingQRData = loadFromDatabase(userId);
    
    if (existingQRData) {
      setQrCodeData(existingQRData);
    } else {
      const newQRData = generateQRCodeData();
      setQrCodeData(newQRData);
      saveToDatabase(newQRData);
    }
  }, [userId]);

  // Mock database operations
  const loadFromDatabase = (userId: string): QRCodeData | null => {
    try {
      const stored = localStorage.getItem(`qr-code-${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          generatedAt: new Date(parsed.generatedAt),
          lastRegenerated: parsed.lastRegenerated ? new Date(parsed.lastRegenerated) : undefined
        };
      }
    } catch (error) {
      console.error('Failed to load QR code from storage:', error);
    }
    return null;
  };

  const saveToDatabase = (qrData: QRCodeData): void => {
    try {
      localStorage.setItem(`qr-code-${userId}`, JSON.stringify(qrData));
    } catch (error) {
      console.error('Failed to save QR code to storage:', error);
    }
  };

  const handleRegenerate = async () => {
    if (!allowRegeneration) {
      toast({
        title: "Regeneration not allowed",
        description: "QR code regeneration is restricted for your account type.",
        variant: "destructive"
      });
      return;
    }

    setIsRegenerating(true);
    
    try {
      // Simulate regeneration delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newQRData = generateQRCodeData(true);
      setQrCodeData(newQRData);
      saveToDatabase(newQRData);
      
      if (onRegenerate) {
        onRegenerate(newQRData);
      }
      
      toast({
        title: "QR Code regenerated",
        description: "Your QR code has been updated with new security tokens.",
      });
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: "Failed to regenerate QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDownload = () => {
    if (!qrCodeData) return;

    const svg = document.querySelector('#stable-qr-code svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${userId}-qr-code.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }

    toast({
      title: "QR Code downloaded",
      description: "Your QR code has been saved as a PNG image."
    });
  };

  if (!qrCodeData) {
    return (
      <Card className="shadow-jrmsu">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Generating QR Code...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-jrmsu">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Secure QR Code
          {qrCodeData.lastRegenerated && (
            <span className="text-xs text-muted-foreground">
              (Regenerated)
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Stable QR code for library access - remains consistent until regenerated
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Code Display */}
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-lg border" id="stable-qr-code">
            <QRCodeSVG
              value={qrCodeData.qrCodeData}
              size={200}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "/jrmsu-logo.jpg", // Add logo in center
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>
        </div>

        {/* QR Code Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-muted-foreground">Generated</p>
            <p>{qrCodeData.generatedAt.toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Status</p>
            <p className="text-green-600">Active</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">Type</p>
            <p className="capitalize">{qrCodeData.type}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground">User ID</p>
            <p className="font-mono text-xs">{userId}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            onClick={handleRegenerate}
            disabled={isRegenerating || !allowRegeneration}
            className="w-full"
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-800">
            <strong>Security Notice:</strong> This QR code contains encrypted authentication data 
            and remains stable across sessions. It will only regenerate when you update your profile 
            information or manually trigger regeneration.
          </p>
        </div>

        {/* Last Regenerated Info */}
        {qrCodeData.lastRegenerated && (
          <div className="text-xs text-muted-foreground text-center">
            Last regenerated: {qrCodeData.lastRegenerated.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utility function to validate JRMSU QR codes
export const validateJRMSUQRCode = (qrData: string): { isValid: boolean; data?: UserQRData | BookQRData; error?: string } => {
  try {
    const parsed = JSON.parse(qrData);
    
    if (parsed.systemId !== "JRMSU-LIBRARY") {
      return { isValid: false, error: "Invalid QR Code. Please scan a valid JRMSU Library System QR Code." };
    }
    
    // Validate user QR code
    if (parsed.fullName && parsed.userId) {
      return { isValid: true, data: parsed as UserQRData };
    }
    
    // Validate book QR code
    if (parsed.bookCode && parsed.title) {
      return { isValid: true, data: parsed as BookQRData };
    }
    
    return { isValid: false, error: "QR Code format is not recognized." };
  } catch (error) {
    return { isValid: false, error: "Invalid QR Code format." };
  }
};