// JRMSU Library QR Code Structure Definition
// This file defines the canonical QR code structure that all components must follow

/**
 * Canonical QR Code Data Structure for JRMSU Library System
 * 
 * This is the SINGLE SOURCE OF TRUTH for QR code structure.
 * All QR generation, scanning, and validation must conform to this interface.
 */
export interface JRMSUQRCode {
  // === REQUIRED CORE FIELDS (Minimal for Better Readability) ===
  
  /** Full name of the user */
  fullName: string;
  
  /** Unique user identifier (KC-23-A-00243 for students, KCL-00001 for admins) */
  userId: string;
  
  /** User type for authentication */
  userType: "admin" | "student";
  
  /** System identifier - must be "JRMSU-LIBRARY" */
  systemId: "JRMSU-LIBRARY";
  
  /** System tag based on user type */
  systemTag: "JRMSU-KCL" | "JRMSU-KCS";
  
  /** QR code generation timestamp for expiration checking */
  timestamp: number;
  
  /** Single session token for authentication (replaces multiple auth codes) */
  sessionToken: string;
  
  /** Role description */
  role: string;
  
  // === LEGACY COMPATIBILITY FIELDS (Optional) ===
  // These are maintained for backward compatibility with existing QR codes
  
  /** Legacy authentication code field */
  authCode?: string;
  
  /** Legacy encrypted token field */
  encryptedToken?: string;
  
  /** Legacy field name for authCode */
  realTimeAuthCode?: string;
  
  /** Legacy field name for encryptedToken */
  encryptedPasswordToken?: string;
  
  /** Two-factor authentication key (if enabled) */
  twoFactorKey?: string;
  
  /** Legacy field name for twoFactorKey */
  twoFactorSetupKey?: string;
  
  /** Department information */
  department?: string;
  
  /** Course information (students only) */
  course?: string;
  
  /** Year level (students only) */
  year?: string;
  
  /** Section (students only) */
  section?: string;
  
  /** Position (admins only) */
  position?: string;
}

/**
 * Validation function to ensure QR code data conforms to canonical structure
 */
export function validateQRCodeStructure(qrData: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required fields
  if (!qrData.fullName || typeof qrData.fullName !== 'string') {
    errors.push('Missing or invalid fullName');
  }
  
  if (!qrData.userId || typeof qrData.userId !== 'string') {
    errors.push('Missing or invalid userId');
  }
  
  if (!qrData.userType || !['admin', 'student'].includes(qrData.userType)) {
    errors.push('Missing or invalid userType (must be "admin" or "student")');
  }
  
  if (!qrData.systemId || qrData.systemId !== 'JRMSU-LIBRARY') {
    errors.push('Missing or invalid systemId (must be "JRMSU-LIBRARY")');
  }
  
  if (!qrData.timestamp || typeof qrData.timestamp !== 'number') {
    errors.push('Missing or invalid timestamp');
  }
  
  if (!qrData.systemTag || !['JRMSU-KCL', 'JRMSU-KCS'].includes(qrData.systemTag)) {
    errors.push('Missing or invalid systemTag (must be "JRMSU-KCL" or "JRMSU-KCS")');
  }
  
  // Check for session token (new format) or legacy authentication fields
  const hasSessionToken = qrData.sessionToken;
  const hasLegacyAuth = qrData.authCode || qrData.realTimeAuthCode || qrData.encryptedToken || qrData.encryptedPasswordToken;
  
  if (!hasSessionToken && !hasLegacyAuth) {
    errors.push('Missing authentication token (sessionToken or legacy auth fields required)');
  }
  
  // Check system tag matches user type
  if (qrData.userType && qrData.systemTag) {
    const expectedTag = qrData.userType === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS';
    if (qrData.systemTag !== expectedTag) {
      errors.push(`System tag mismatch: expected ${expectedTag} for ${qrData.userType}, got ${qrData.systemTag}`);
    }
  }
  
  // Check for deprecated but still functioning legacy fields
  if (qrData.id && !qrData.userId) {
    warnings.push('Using deprecated "id" field instead of "userId"');
  }
  
  if (qrData.name && !qrData.fullName) {
    warnings.push('Using deprecated "name" field instead of "fullName"');
  }
  
  if (qrData.logo && !qrData.systemTag) {
    warnings.push('Using deprecated "logo" field instead of "systemTag"');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate a canonical QR code data object
 */
export function generateCanonicalQRCode(userData: {
  userId: string;
  fullName: string;
  userType: 'admin' | 'student';
  department?: string;
  course?: string;
  year?: string;
  section?: string;
  position?: string;
  twoFactorKey?: string;
}): JRMSUQRCode {
  const timestamp = Date.now();
  return {
    // Required fields - streamlined for better readability
    fullName: userData.fullName,
    userId: userData.userId,
    userType: userData.userType,
    systemId: 'JRMSU-LIBRARY',
    systemTag: userData.userType === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS',
    timestamp: timestamp,
    sessionToken: btoa(`${userData.userId}-${timestamp}`),
    role: userData.userType === 'admin' ? 'Administrator' : 'Student',
    
    // Optional legacy fields for backward compatibility
    twoFactorKey: userData.twoFactorKey,
    department: userData.department,
    course: userData.course,
    year: userData.year,
    section: userData.section,
    position: userData.position,
    twoFactorSetupKey: userData.twoFactorKey
  };
}

/**
 * Type guard to check if object conforms to JRMSUQRCode interface
 */
export function isJRMSUQRCode(obj: any): obj is JRMSUQRCode {
  return validateQRCodeStructure(obj).isValid;
}

export default JRMSUQRCode;