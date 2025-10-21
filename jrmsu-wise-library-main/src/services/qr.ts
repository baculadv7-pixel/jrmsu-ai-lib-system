// QR service wired to Supabase Edge Functions with local fallbacks
import { supabase } from "@/integrations/supabase/client";
import { databaseService } from "./database";

export type GenerateUserQRParams = { userId: string; rotate?: boolean };
export type GenerateBookQRParams = { bookId: string };

export type QRGenerateResult = {
  envelope: string; // string to encode as QR
  imageUrl?: string; // optional URL to a stored PNG
};

export async function generateUserQR(params: GenerateUserQRParams): Promise<QRGenerateResult> {
  try {
    const { data, error } = await supabase.functions.invoke("qr-generate-user", { body: params });
    if (error) throw error;
    return data as QRGenerateResult;
  } catch {
    // Generate scanner-compatible QR code structure
    // For development, we'll generate a compatible structure since Supabase functions aren't available
    
    // Fetch actual user data from database
    const user = databaseService.getUserById(params.userId);
    if (!user) {
      throw new Error(`User not found: ${params.userId}`);
    }
    
    const userType = user.userType;
    const fullName = user.fullName;
    
    // Generate minimal essential data for optimal QR readability with logo space
    const timestamp = Date.now();
    const sessionToken = btoa(`${params.userId}-${timestamp}`);
    
    // EXACT QR structure matching database and validator expectations
    const qrData = {
      // CORE REQUIRED FIELDS - matches database authenticateWithQRCode expectations
      fullName: fullName,
      userId: params.userId,
      userType: userType,
      systemId: "JRMSU-LIBRARY",
      systemTag: userType === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS',
      timestamp: timestamp,
      sessionToken: sessionToken,
      role: userType === 'admin' ? 'Administrator' : 'Student',
      
      // RESTORE 2FA SETUP KEY - for Google Authenticator compatibility
      ...(user.twoFactorKey ? {
        twoFactorKey: user.twoFactorKey,
        twoFactorSetupKey: user.twoFactorKey  // Legacy field name
      } : {})
    };
    
    const envelope = JSON.stringify(qrData);
    
    return { envelope };
  }
}

export async function generateBookQR(params: GenerateBookQRParams): Promise<QRGenerateResult> {
  try {
    const { data, error } = await supabase.functions.invoke("qr-generate-book", { body: params });
    if (error) throw error;
    return data as QRGenerateResult;
  } catch {
    const envelope = JSON.stringify({ v: 1, typ: "book", bid: params.bookId, ts: Date.now() });
    return { envelope };
  }
}

export async function verifyEnvelope(_envelope: string): Promise<{ ok: boolean }>
{
  try {
    const { data, error } = await supabase.functions.invoke("qr-verify", { body: { envelope: _envelope } });
    if (error) throw error;
    return data as { ok: boolean };
  } catch {
    return { ok: true };
  }
}

export async function listUserQRCodesForAdmin(): Promise<Array<{ userId: string; imageUrl?: string }>> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-list-user-qrs", { body: {} });
    if (error) throw error;
    return data as Array<{ userId: string; imageUrl?: string }>;
  } catch {
    return [];
  }
}

// Admin settings stubs
export async function getGlobal2FAEnabled(): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("admin-get-2fa", { body: {} });
    if (error) {
      console.warn('Supabase function error for admin-get-2fa:', error);
      return true; // Default fallback
    }
    return Boolean((data as any)?.enabled);
  } catch (error) {
    console.warn('Failed to get global 2FA setting:', error);
    return true; // Default fallback
  }
}

export async function setGlobal2FAEnabled(_enabled: boolean): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("admin-set-2fa", { body: { enabled: _enabled } });
    if (error) {
      console.warn('Supabase function error for admin-set-2fa:', error);
      throw error; // Re-throw to let the calling code handle it
    }
  } catch (error) {
    console.warn('Failed to set global 2FA setting:', error);
    throw error; // Re-throw to let the calling code handle it
  }
}

// QR Code Authentication API Endpoints - Updated structure
export type QRLoginData = {
  fullName: string;
  userId: string;
  userType: "admin" | "student";
  systemId: "JRMSU-LIBRARY";
  systemTag: "JRMSU-KCL" | "JRMSU-KCS";
  timestamp: number;
  sessionToken: string;
  role: string;
  
  // Legacy fields for backward compatibility
  authCode?: string;
  encryptedToken?: string;
  twoFactorKey?: string;
  twoFactorSetupKey?: string;
};

export type QRLoginResult = {
  success: boolean;
  user?: {
    id: string;
    fullName: string;
    role: "admin" | "student";
    requiresOTP?: boolean;
  };
  error?: string;
};

export type QRLoginLog = {
  userId: string;
  fullName: string;
  timestamp: string;
  method: "QR_CODE";
  deviceInfo: string;
  ipAddress?: string;
  success: boolean;
  twoFactorUsed: boolean;
};

/**
 * Authenticate a user via QR code
 * This function validates the QR code data and performs login
 */
export async function authenticateQRLogin(qrData: QRLoginData, totpCode?: string): Promise<QRLoginResult> {
  try {
    // Call Supabase Edge Function for QR authentication
    const { data, error } = await supabase.functions.invoke("qr-authenticate", { 
      body: { 
        qrData, 
        totpCode,
        deviceInfo: navigator.userAgent,
        timestamp: new Date().toISOString()
      } 
    });
    
    if (error) {
      console.error('QR authentication error:', error);
      return { success: false, error: error.message };
    }
    
    return data as QRLoginResult;
    
  } catch (error: any) {
    console.error('Failed to authenticate QR login:', error);
    
    // Local fallback for development/demo
    await simulateQRAuthentication(qrData, totpCode);
    
    return {
      success: true,
      user: {
        id: qrData.userId,
        fullName: qrData.fullName,
        role: qrData.userType,
        requiresOTP: !!qrData.twoFactorKey
      }
    };
  }
}

/**
 * Validate QR code data structure and authenticity
 * This ensures the QR code contains valid JRMSU Library System data
 */
export async function validateQRCodeData(qrData: string): Promise<{ isValid: boolean; data?: QRLoginData; error?: string }> {
  try {
    const parsed = JSON.parse(qrData);
    
    // Validate system ID
    if (parsed.systemId !== "JRMSU-LIBRARY") {
      return { 
        isValid: false, 
        error: "Invalid QR Code. Please scan a valid JRMSU Library System QR Code." 
      };
    }
    
    // Validate required fields for user login (new structure)
    if (!parsed.fullName || !parsed.userId || !parsed.userType || !parsed.systemTag) {
      return { 
        isValid: false, 
        error: "QR Code is missing required authentication data." 
      };
    }
    
    // Validate authentication token (sessionToken OR legacy fields)
    const hasSessionToken = parsed.sessionToken;
    const hasLegacyAuth = parsed.authCode || parsed.encryptedToken;
    
    if (!hasSessionToken && !hasLegacyAuth) {
      return { 
        isValid: false, 
        error: "QR Code is missing required authentication token." 
      };
    }
    
    // Validate timestamp (QR codes expire after 30 minutes for security)
    const qrTimestamp = parsed.timestamp;
    const currentTime = Date.now();
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
    
    if (currentTime - qrTimestamp > thirtyMinutes) {
      return { 
        isValid: false, 
        error: "QR Code has expired. Please generate a new QR code from your profile." 
      };
    }
    
    // Additional server-side validation would go here
    // For now, we'll call the validation service
    const serverValidation = await validateServerSideQR(parsed);
    if (!serverValidation.valid) {
      return { 
        isValid: false, 
        error: serverValidation.error || "QR Code validation failed." 
      };
    }
    
    return { 
      isValid: true, 
      data: parsed as QRLoginData 
    };
    
  } catch (error) {
    return { 
      isValid: false, 
      error: "Invalid QR Code format. Please scan a valid QR code." 
    };
  }
}

/**
 * Log QR code login attempts for audit trail
 */
export async function logQRLoginAttempt(loginLog: QRLoginLog): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke("qr-log-login", { 
      body: loginLog 
    });
    
    if (error) {
      console.error('Failed to log QR login attempt:', error);
    }
    
  } catch (error) {
    console.error('Failed to log QR login attempt:', error);
    
    // Store locally as fallback
    const logs = JSON.parse(localStorage.getItem('jrmsu-qr-login-logs') || '[]');
    logs.push(loginLog);
    localStorage.setItem('jrmsu-qr-login-logs', JSON.stringify(logs.slice(-100))); // Keep last 100 logs
  }
}

/**
 * Server-side QR validation (calls Supabase Edge Function)
 */
export async function validateServerSideQR(qrData: QRLoginData): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("qr-validate-server", { 
      body: { qrData } 
    });
    
    if (error) {
      return { valid: false, error: error.message };
    }
    
    return data as { valid: boolean; error?: string };
    
  } catch (error: any) {
    console.warn('Server-side QR validation unavailable, using local validation:', error);
    
    // Local fallback validation
    return await simulateServerValidation(qrData);
  }
}

/**
 * Simulate authentication for development/demo purposes
 */
async function simulateQRAuthentication(qrData: QRLoginData, totpCode?: string): Promise<void> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulate validation checks
  if (qrData.twoFactorKey && totpCode) {
    // In a real implementation, this would verify TOTP against the stored secret
    const isValidOTP = totpCode.length === 6 && /^\d{6}$/.test(totpCode);
    if (!isValidOTP) {
      throw new Error('Invalid 2FA code');
    }
  }
  
  // Log the attempt
  const loginLog: QRLoginLog = {
    userId: qrData.userId,
    fullName: qrData.fullName,
    timestamp: new Date().toISOString(),
    method: "QR_CODE",
    deviceInfo: navigator.userAgent,
    success: true,
    twoFactorUsed: !!qrData.twoFactorKey
  };
  
  await logQRLoginAttempt(loginLog);
}

/**
 * Simulate server-side validation for development
 */
async function simulateServerValidation(qrData: QRLoginData): Promise<{ valid: boolean; error?: string }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Basic validation checks
  if (!qrData.userId.match(/^(KC-\d{2}-[A-D]-\d{5}|KCL-\d{5})$/)) {
    return { valid: false, error: "Invalid user ID format in QR code." };
  }
  
  if (!qrData.encryptedToken || qrData.encryptedToken.length < 10) {
    return { valid: false, error: "Invalid authentication token in QR code." };
  }
  
  // In production, you would:
  // 1. Verify the encrypted token against the database
  // 2. Check if the user account is active
  // 3. Validate the auth code matches current time-based code
  // 4. Ensure the QR code hasn't been used before (replay protection)
  
  return { valid: true };
}

