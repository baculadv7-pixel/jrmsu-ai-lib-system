// End-to-End QR Code Testing Utility
// This utility tests the complete QR code flow from generation to authentication

import { generateUserQR } from '@/services/qr';
import { validateJRMSUQRCode } from '@/components/qr/StableQRCode';
import { databaseService } from '@/services/database';

export interface QRTestResult {
  step: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export async function testCompleteQRFlow(userId: string): Promise<QRTestResult[]> {
  const results: QRTestResult[] = [];
  
  console.log(`🧪 Starting End-to-End QR Test for user: ${userId}`);
  
  try {
    // Step 1: Generate QR Code
    console.log('Step 1: Generating QR Code...');
    const qrResult = await generateUserQR({ userId });
    
    if (!qrResult.envelope) {
      results.push({
        step: '1. QR Generation',
        success: false,
        message: 'Failed to generate QR code envelope',
        error: 'No envelope returned'
      });
      return results;
    }
    
    results.push({
      step: '1. QR Generation',
      success: true,
      message: `QR code generated successfully`,
      data: qrResult.envelope.substring(0, 100) + '...'
    });
    
    // Step 2: Parse and validate QR structure
    console.log('Step 2: Validating QR Code Structure...');
    let parsedQR;
    try {
      parsedQR = JSON.parse(qrResult.envelope);
      results.push({
        step: '2. QR Parsing',
        success: true,
        message: 'QR code parsed successfully',
        data: Object.keys(parsedQR)
      });
    } catch (error) {
      results.push({
        step: '2. QR Parsing',
        success: false,
        message: 'Failed to parse QR code JSON',
        error: (error as Error).message
      });
      return results;
    }
    
    // Step 3: Validate with scanner logic
    console.log('Step 3: Scanner validation...');
    const validation = validateJRMSUQRCode(qrResult.envelope);
    
    results.push({
      step: '3. Scanner Validation',
      success: validation.isValid,
      message: validation.isValid ? 'QR code passed scanner validation' : 'QR code failed scanner validation',
      error: validation.error,
      data: validation.data ? Object.keys(validation.data) : null
    });
    
    if (!validation.isValid) {
      return results;
    }
    
    // Step 4: Test database authentication
    console.log('Step 4: Database authentication...');
    const authResult = databaseService.authenticateWithQRCode(validation.data);
    
    results.push({
      step: '4. Database Auth',
      success: authResult.success,
      message: authResult.success ? 'Database authentication successful' : 'Database authentication failed',
      error: authResult.error,
      data: authResult.user ? { id: authResult.user.id, fullName: authResult.user.fullName } : null
    });
    
    // Step 5: Check required fields mapping
    console.log('Step 5: Field mapping verification...');
    if (authResult.success && authResult.user) {
      const fieldMappingIssues = [];
      
      if (parsedQR.userId !== authResult.user.id) {
        fieldMappingIssues.push(`userId mismatch: QR=${parsedQR.userId}, DB=${authResult.user.id}`);
      }
      
      if (parsedQR.userType !== authResult.user.userType) {
        fieldMappingIssues.push(`userType mismatch: QR=${parsedQR.userType}, DB=${authResult.user.userType}`);
      }
      
      if (parsedQR.fullName !== authResult.user.fullName) {
        fieldMappingIssues.push(`fullName mismatch: QR="${parsedQR.fullName}", DB="${authResult.user.fullName}"`);
      }
      
      results.push({
        step: '5. Field Mapping',
        success: fieldMappingIssues.length === 0,
        message: fieldMappingIssues.length === 0 ? 'All fields mapped correctly' : 'Field mapping issues found',
        error: fieldMappingIssues.join('; '),
        data: {
          qrFields: Object.keys(parsedQR),
          dbFields: Object.keys(authResult.user)
        }
      });
    }
    
  } catch (error) {
    results.push({
      step: 'Test Execution',
      success: false,
      message: 'Test execution failed',
      error: (error as Error).message
    });
  }
  
  // Summary
  const passedSteps = results.filter(r => r.success).length;
  const totalSteps = results.length;
  
  console.log(`\n📊 QR Test Results for ${userId}:`);
  console.log(`✅ Passed: ${passedSteps}/${totalSteps} steps`);
  results.forEach((result, i) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.step}: ${result.message}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  return results;
}

export async function testAllSampleUsers(): Promise<void> {
  const sampleUserIds = [
    'KCL-00001', // Admin
    'KC-23-A-00243' // Student
  ];
  
  console.log('🧪 Testing QR Flow for All Sample Users...\n');
  
  for (const userId of sampleUserIds) {
    await testCompleteQRFlow(userId);
    console.log('---\n');
  }
}

// Export to window for console access
(window as any).testCompleteQRFlow = testCompleteQRFlow;
(window as any).testAllSampleUsers = testAllSampleUsers;

export default testCompleteQRFlow;