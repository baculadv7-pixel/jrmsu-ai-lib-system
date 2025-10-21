// QR Code Data Consistency Test Utility
// This file helps verify that QR code generation, scanning, and database authentication are aligned

import { validateJRMSUQRCode } from '@/components/qr/StableQRCode';
import { databaseService } from '@/services/database';

export interface TestUser {
  id: string;
  fullName: string;
  userType: 'admin' | 'student';
  systemTag: string;
}

export function generateTestQRData(user: TestUser) {
  return JSON.stringify({
    fullName: user.fullName,
    userId: user.id,
    userType: user.userType,
    department: user.userType === 'admin' ? 'IT Department' : 'Computer Science',
    course: user.userType === 'student' ? 'BSCS' : undefined,
    year: user.userType === 'student' ? '4th Year' : undefined,
    role: user.userType === 'admin' ? 'Administrator' : 'Student',
    authCode: Math.random().toString().slice(2, 8),
    encryptedToken: btoa(`${user.id}-${Date.now()}`),
    twoFactorKey: 'DEMO2FA123456',
    realTimeAuthCode: Math.random().toString().slice(2, 8),
    encryptedPasswordToken: btoa(`${user.id}-${Date.now()}`),
    twoFactorSetupKey: 'DEMO2FA123456',
    systemTag: user.systemTag,
    timestamp: Date.now(),
    systemId: 'JRMSU-LIBRARY'
  });
}

export function testQRCodeConsistency() {
  console.log('🧪 Testing QR Code Data Consistency Across Registration, Profiles, and Scanner...\n');

  // Test users
  const testUsers: TestUser[] = [
    {
      id: 'KCL-00001',
      fullName: 'John Mark Santos',
      userType: 'admin',
      systemTag: 'JRMSU-KCL'
    },
    {
      id: 'KC-23-A-00243',
      fullName: 'Juan Miguel Dela Cruz',
      userType: 'student',
      systemTag: 'JRMSU-KCS'
    }
  ];

  const results = {
    passed: 0,
    failed: 0,
    issues: [] as string[]
  };

  testUsers.forEach((user, index) => {
    console.log(`\n🔍 Testing ${user.userType}: ${user.fullName} (${user.id})`);
    
    try {
      // Step 1: Generate QR code data
      const qrData = generateTestQRData(user);
      console.log('✅ QR data generated successfully');

      // Step 2: Validate QR code structure
      const validation = validateJRMSUQRCode(qrData);
      if (!validation.isValid) {
        throw new Error(`QR validation failed: ${validation.error}`);
      }
      console.log('✅ QR validation passed');

      // Step 3: Test database authentication
      const authResult = databaseService.authenticateWithQRCode(validation.data);
      if (!authResult.success) {
        throw new Error(`Database auth failed: ${authResult.error}`);
      }
      console.log('✅ Database authentication passed');

      // Step 4: Verify user data consistency
      const dbUser = authResult.user!;
      if (dbUser.fullName !== user.fullName) {
        throw new Error(`Name mismatch: expected ${user.fullName}, got ${dbUser.fullName}`);
      }
      if (dbUser.id !== user.id) {
        throw new Error(`ID mismatch: expected ${user.id}, got ${dbUser.id}`);
      }
      if (dbUser.userType !== user.userType) {
        throw new Error(`Type mismatch: expected ${user.userType}, got ${dbUser.userType}`);
      }
      console.log('✅ User data consistency verified');

      results.passed++;
      console.log(`✅ Test ${index + 1} PASSED`);

    } catch (error) {
      results.failed++;
      const issue = `Test ${index + 1} FAILED: ${(error as Error).message}`;
      results.issues.push(issue);
      console.log(`❌ ${issue}`);
    }
  });

  // Summary
  console.log(`\n📊 QR Code Consistency Test Results:`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.issues.length > 0) {
    console.log(`\n🐛 Issues Found:`);
    results.issues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue}`);
    });
  } else {
    console.log(`\n🎉 All tests passed! QR code system is consistent.`);
  }

  return results;
}

// Export test function for use in console
(window as any).testQRCodeConsistency = testQRCodeConsistency;

export default testQRCodeConsistency;