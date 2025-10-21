// QR Code Structure Verification and Testing Utility
// This utility ensures all QR code components (generator, scanner, validator) use consistent data structures

export interface JRMSUQRCodeStructure {
  // REQUIRED FIELDS - must be present for validation
  fullName: string;                   // User's full name
  userId: string;                     // User ID (KC-XX-X-XXXXX or KCL-XXXXX)
  userType: "admin" | "student";      // User type
  authCode: string;                   // Real-time authentication code
  encryptedToken: string;             // Encrypted authentication token
  systemId: "JRMSU-LIBRARY";          // System identifier (constant)
  timestamp: number;                  // Generation timestamp (milliseconds)
  systemTag: "JRMSU-KCL" | "JRMSU-KCS"; // System tag based on user type

  // OPTIONAL FIELDS - enhance functionality but not required for basic validation
  department?: string;                // User's department
  course?: string;                    // Student's course
  year?: string;                      // Student's year level
  section?: string;                   // Student's section
  position?: string;                  // User's position
  role?: string;                      // User's role description
  twoFactorKey?: string;              // 2FA setup key

  // LEGACY COMPATIBILITY FIELDS - support both old and new field names
  realTimeAuthCode?: string;          // Legacy name for authCode
  encryptedPasswordToken?: string;    // Legacy name for encryptedToken
  twoFactorSetupKey?: string;         // Legacy name for twoFactorKey

  // METADATA (optional, for debugging)
  generatedBy?: string;               // Which service generated this QR
  version?: string;                   // QR code format version
}

/**
 * Validate QR code structure against JRMSU requirements
 */
export function validateQRStructure(qrData: string): {
  isValid: boolean;
  data?: JRMSUQRCodeStructure;
  error?: string;
  missingFields?: string[];
  warnings?: string[];
} {
  try {
    if (!qrData || qrData.trim().length === 0) {
      return {
        isValid: false,
        error: "QR code data is empty"
      };
    }

    const parsed = JSON.parse(qrData);
    const missingFields: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!parsed.fullName) missingFields.push("fullName");
    if (!parsed.userId) missingFields.push("userId");
    if (!parsed.userType) missingFields.push("userType");
    if (!parsed.systemId) missingFields.push("systemId");
    if (!parsed.timestamp) missingFields.push("timestamp");
    if (!parsed.systemTag) missingFields.push("systemTag");

    // Check authentication fields (support both new and legacy names)
    const authCode = parsed.authCode || parsed.realTimeAuthCode;
    const encryptedToken = parsed.encryptedToken || parsed.encryptedPasswordToken;

    if (!authCode) missingFields.push("authCode/realTimeAuthCode");
    if (!encryptedToken) missingFields.push("encryptedToken/encryptedPasswordToken");

    if (missingFields.length > 0) {
      return {
        isValid: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
        missingFields
      };
    }

    // Validate system ID
    if (parsed.systemId !== "JRMSU-LIBRARY") {
      return {
        isValid: false,
        error: `Invalid system ID. Expected "JRMSU-LIBRARY", got "${parsed.systemId}"`
      };
    }

    // Validate user type
    if (!["admin", "student"].includes(parsed.userType)) {
      return {
        isValid: false,
        error: `Invalid user type. Expected "admin" or "student", got "${parsed.userType}"`
      };
    }

    // Validate system tag matches user type
    const expectedSystemTag = parsed.userType === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS';
    if (parsed.systemTag !== expectedSystemTag) {
      return {
        isValid: false,
        error: `Invalid system tag. Expected "${expectedSystemTag}" for ${parsed.userType}, got "${parsed.systemTag}"`
      };
    }

    // Validate user ID format
    const userIdPattern = parsed.userType === 'student' 
      ? /^KC-\d{2}-[A-D]-\d{5}$/ 
      : /^KCL-\d{5}$/;
    
    if (!userIdPattern.test(parsed.userId)) {
      warnings.push(`User ID format may be incorrect for ${parsed.userType}: ${parsed.userId}`);
    }

    // Check for timestamp expiration (30 minutes)
    const currentTime = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    if (currentTime - parsed.timestamp > thirtyMinutes) {
      warnings.push("QR code has expired (older than 30 minutes)");
    }

    // Check for legacy field usage
    if (parsed.realTimeAuthCode && !parsed.authCode) {
      warnings.push("Using legacy field 'realTimeAuthCode' - consider updating to 'authCode'");
    }
    
    if (parsed.encryptedPasswordToken && !parsed.encryptedToken) {
      warnings.push("Using legacy field 'encryptedPasswordToken' - consider updating to 'encryptedToken'");
    }

    return {
      isValid: true,
      data: parsed as JRMSUQRCodeStructure,
      warnings: warnings.length > 0 ? warnings : undefined
    };

  } catch (error) {
    return {
      isValid: false,
      error: `JSON parsing error: ${(error as Error).message}`
    };
  }
}

/**
 * Generate a test QR code with correct structure
 */
export function generateTestQRStructure(
  userType: "admin" | "student" = "student",
  userId?: string
): JRMSUQRCodeStructure {
  const timestamp = Date.now();
  const defaultUserId = userType === 'admin' 
    ? `KCL-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`
    : `KC-24-A-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

  const authCode = Math.random().toString().slice(2, 8);
  const encryptedToken = btoa(`${userId || defaultUserId}-${timestamp}-auth`);

  return {
    // REQUIRED FIELDS
    fullName: userType === 'admin' ? 'Test Admin User' : 'Test Student User',
    userId: userId || defaultUserId,
    userType,
    authCode,
    encryptedToken,
    systemId: "JRMSU-LIBRARY",
    timestamp,
    systemTag: userType === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS',

    // OPTIONAL FIELDS
    department: userType === 'admin' ? 'Administration' : 'Computer Science',
    course: userType === 'student' ? 'BSCS' : undefined,
    year: userType === 'student' ? '4th Year' : undefined,
    role: userType === 'admin' ? 'System Administrator' : 'Student',

    // LEGACY COMPATIBILITY
    realTimeAuthCode: authCode,
    encryptedPasswordToken: encryptedToken,

    // METADATA
    generatedBy: 'generateTestQRStructure',
    version: '2.0'
  };
}

/**
 * Test QR code compatibility across all components
 */
export async function testQRCodeCompatibility(): Promise<{
  success: boolean;
  results: Array<{
    test: string;
    passed: boolean;
    message: string;
  }>;
}> {
  const results = [];

  // Test 1: Generate and validate admin QR
  try {
    const adminQR = generateTestQRStructure('admin');
    const adminValidation = validateQRStructure(JSON.stringify(adminQR));
    
    results.push({
      test: 'Admin QR Generation & Validation',
      passed: adminValidation.isValid,
      message: adminValidation.isValid 
        ? 'Admin QR structure is valid'
        : adminValidation.error || 'Unknown error'
    });
  } catch (error) {
    results.push({
      test: 'Admin QR Generation & Validation',
      passed: false,
      message: `Error: ${(error as Error).message}`
    });
  }

  // Test 2: Generate and validate student QR
  try {
    const studentQR = generateTestQRStructure('student');
    const studentValidation = validateQRStructure(JSON.stringify(studentQR));
    
    results.push({
      test: 'Student QR Generation & Validation',
      passed: studentValidation.isValid,
      message: studentValidation.isValid 
        ? 'Student QR structure is valid'
        : studentValidation.error || 'Unknown error'
    });
  } catch (error) {
    results.push({
      test: 'Student QR Generation & Validation',
      passed: false,
      message: `Error: ${(error as Error).message}`
    });
  }

  // Test 3: Legacy compatibility
  try {
    const legacyQR = {
      fullName: 'Legacy User',
      userId: 'KC-23-A-12345',
      userType: 'student',
      realTimeAuthCode: '123456', // Legacy field name
      encryptedPasswordToken: btoa('legacy-token'), // Legacy field name
      systemId: 'JRMSU-LIBRARY',
      timestamp: Date.now(),
      systemTag: 'JRMSU-KCS'
    };
    
    const legacyValidation = validateQRStructure(JSON.stringify(legacyQR));
    
    results.push({
      test: 'Legacy Field Compatibility',
      passed: legacyValidation.isValid,
      message: legacyValidation.isValid 
        ? 'Legacy fields are properly supported'
        : legacyValidation.error || 'Unknown error'
    });
  } catch (error) {
    results.push({
      test: 'Legacy Field Compatibility',
      passed: false,
      message: `Error: ${(error as Error).message}`
    });
  }

  // Test 4: Missing required fields
  try {
    const incompleteQR = {
      fullName: 'Incomplete User',
      userId: 'KC-24-A-00001'
      // Missing required fields
    };
    
    const incompleteValidation = validateQRStructure(JSON.stringify(incompleteQR));
    
    results.push({
      test: 'Missing Fields Detection',
      passed: !incompleteValidation.isValid && incompleteValidation.missingFields && incompleteValidation.missingFields.length > 0,
      message: !incompleteValidation.isValid 
        ? `Correctly detected missing fields: ${incompleteValidation.missingFields?.join(', ')}`
        : 'Failed to detect missing required fields'
    });
  } catch (error) {
    results.push({
      test: 'Missing Fields Detection',
      passed: false,
      message: `Error: ${(error as Error).message}`
    });
  }

  const allPassed = results.every(result => result.passed);

  return {
    success: allPassed,
    results
  };
}

/**
 * Console logging utilities for debugging
 */
export function logQRStructureTest(): void {
  console.group('🧪 QR Code Structure Test');
  
  testQRCodeCompatibility().then(({ success, results }) => {
    console.log(`\n📋 Overall Result: ${success ? '✅ PASSED' : '❌ FAILED'}\n`);
    
    results.forEach((result, index) => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${index + 1}. ${icon} ${result.test}`);
      console.log(`   ${result.message}\n`);
    });
    
    console.log('📊 Summary:');
    console.log(`   Passed: ${results.filter(r => r.passed).length}/${results.length}`);
    console.log(`   Failed: ${results.filter(r => !r.passed).length}/${results.length}`);
    
    console.groupEnd();
  });
}

// Export functions to window for console access
(window as any).validateQRStructure = validateQRStructure;
(window as any).generateTestQRStructure = generateTestQRStructure;
(window as any).testQRCodeCompatibility = testQRCodeCompatibility;
(window as any).logQRStructureTest = logQRStructureTest;

export default {
  validateQRStructure,
  generateTestQRStructure,
  testQRCodeCompatibility,
  logQRStructureTest
};