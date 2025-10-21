// QR Code Scannability Test Utility
// This utility tests if generated QR codes are properly scannable

import { generateUserQR } from '@/services/qr';
import { validateJRMSUQRCode } from '@/components/qr/StableQRCode';
import { databaseService } from '@/services/database';

export interface ScannabilityTestResult {
  userId: string;
  qrGenerated: boolean;
  qrData?: any;
  qrParseable: boolean;
  scannerValidation: boolean;
  databaseAuth: boolean;
  fullNameMatch: boolean;
  errors: string[];
  warnings: string[];
  summary: string;
}

export async function testQRCodeScannability(userId: string): Promise<ScannabilityTestResult> {
  const result: ScannabilityTestResult = {
    userId,
    qrGenerated: false,
    qrParseable: false,
    scannerValidation: false,
    databaseAuth: false,
    fullNameMatch: false,
    errors: [],
    warnings: [],
    summary: ''
  };

  try {
    console.log(`🔍 Testing QR scannability for user: ${userId}`);

    // Step 1: Generate QR code
    console.log('Step 1: Generating QR code...');
    try {
      const qrResult = await generateUserQR({ userId });
      if (qrResult.envelope) {
        result.qrGenerated = true;
        console.log('✅ QR code generated successfully');
        
        // Step 2: Parse QR data
        console.log('Step 2: Parsing QR data...');
        try {
          const parsedData = JSON.parse(qrResult.envelope);
          result.qrData = parsedData;
          result.qrParseable = true;
          console.log('✅ QR data parsed successfully');
          console.log('📄 QR Data structure:', Object.keys(parsedData));
          
          // Step 3: Validate with scanner
          console.log('Step 3: Testing scanner validation...');
          const validation = validateJRMSUQRCode(qrResult.envelope);
          result.scannerValidation = validation.isValid;
          
          if (validation.isValid) {
            console.log('✅ Scanner validation passed');
            
            // Step 4: Test database authentication
            console.log('Step 4: Testing database authentication...');
            const authResult = databaseService.authenticateWithQRCode(validation.data);
            result.databaseAuth = authResult.success;
            
            if (authResult.success) {
              console.log('✅ Database authentication passed');
              
              // Step 5: Check full name matching
              console.log('Step 5: Checking data consistency...');
              const dbUser = authResult.user!;
              const qrFullName = parsedData.fullName;
              const dbFullName = dbUser.fullName;
              
              result.fullNameMatch = qrFullName === dbFullName;
              
              if (result.fullNameMatch) {
                console.log('✅ Full name matching passed');
                console.log(`   QR: "${qrFullName}"`);
                console.log(`   DB: "${dbFullName}"`);
              } else {
                result.errors.push(`Full name mismatch: QR="${qrFullName}" vs DB="${dbFullName}"`);
                console.log(`❌ Full name mismatch:`);
                console.log(`   QR: "${qrFullName}"`);
                console.log(`   DB: "${dbFullName}"`);
              }
            } else {
              result.errors.push(`Database authentication failed: ${authResult.error}`);
              console.log(`❌ Database authentication failed: ${authResult.error}`);
            }
          } else {
            result.errors.push(`Scanner validation failed: ${validation.error}`);
            console.log(`❌ Scanner validation failed: ${validation.error}`);
          }
        } catch (parseError) {
          result.errors.push(`QR data parsing failed: ${(parseError as Error).message}`);
          console.log(`❌ QR data parsing failed: ${(parseError as Error).message}`);
        }
      } else {
        result.errors.push('QR generation returned no envelope');
        console.log('❌ QR generation returned no envelope');
      }
    } catch (genError) {
      result.errors.push(`QR generation failed: ${(genError as Error).message}`);
      console.log(`❌ QR generation failed: ${(genError as Error).message}`);
    }

  } catch (error) {
    result.errors.push(`Test execution failed: ${(error as Error).message}`);
    console.log(`❌ Test execution failed: ${(error as Error).message}`);
  }

  // Generate summary
  const passedTests = [
    result.qrGenerated,
    result.qrParseable, 
    result.scannerValidation,
    result.databaseAuth,
    result.fullNameMatch
  ].filter(Boolean).length;

  const totalTests = 5;
  
  if (passedTests === totalTests) {
    result.summary = '🎉 FULLY SCANNABLE - QR code should work perfectly with scanner';
  } else if (passedTests >= 3) {
    result.summary = '⚠️ PARTIALLY SCANNABLE - QR code may work but has issues';
  } else {
    result.summary = '❌ NOT SCANNABLE - QR code will not work with scanner';
  }

  console.log(`\n📊 Scannability Test Results for ${userId}:`);
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`📝 Summary: ${result.summary}`);
  
  if (result.errors.length > 0) {
    console.log(`\n🐛 Issues Found:`);
    result.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
  }

  if (result.warnings.length > 0) {
    console.log(`\n⚠️ Warnings:`);
    result.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
  }

  return result;
}

export async function testAllUsersScannability(): Promise<void> {
  const userIds = ['KCL-00001', 'KC-23-A-00243'];
  
  console.log('🧪 Testing QR Code Scannability for All Sample Users...\n');
  
  for (const userId of userIds) {
    await testQRCodeScannability(userId);
    console.log(''.padEnd(50, '─') + '\n');
  }
  
  console.log('🏁 All scannability tests completed!');
}

// Export to window for console access
(window as any).testQRCodeScannability = testQRCodeScannability;
(window as any).testAllUsersScannability = testAllUsersScannability;

export default testQRCodeScannability;