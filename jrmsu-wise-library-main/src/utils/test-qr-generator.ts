// Test QR Code Generator
// This utility generates simple QR codes without logos for testing scanner functionality

import QRCode from 'qrcode';

export interface TestQRData {
  userId: string;
  fullName: string;
  userType: 'admin' | 'student';
  systemId: string;
  systemTag: string;
  authCode: string;
  encryptedToken: string;
  timestamp: number;
}

export async function generateTestQR(data: TestQRData): Promise<string> {
  try {
    const qrString = JSON.stringify(data);
    
    // Generate simple QR without logo using HIGH error correction
    const qrDataUrl = await QRCode.toDataURL(qrString, {
      width: 200,
      height: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H' // High error correction
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating test QR:', error);
    throw error;
  }
}

export async function generateAndDisplayTestQR(containerId: string, userData: TestQRData): Promise<void> {
  try {
    const qrDataUrl = await generateTestQR(userData);
    
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Create image element
    const img = document.createElement('img');
    img.src = qrDataUrl;
    img.style.width = '200px';
    img.style.height = '200px';
    img.style.border = '2px solid #ccc';
    img.alt = 'Test QR Code';
    
    // Add title
    const title = document.createElement('div');
    title.textContent = `Test QR for ${userData.fullName}`;
    title.style.textAlign = 'center';
    title.style.marginBottom = '10px';
    title.style.fontWeight = 'bold';
    
    container.appendChild(title);
    container.appendChild(img);
    
    console.log('✅ Test QR code displayed successfully');
    console.log('📄 QR Data:', userData);
    
  } catch (error) {
    console.error('❌ Failed to generate and display test QR:', error);
  }
}

export function createTestUser(userType: 'admin' | 'student', userId: string): TestQRData {
  const timestamp = Date.now();
  
  const userData: TestQRData = {
    userId: userId,
    fullName: userType === 'admin' ? 'Test Admin User' : 'Test Student User',
    userType: userType,
    systemId: 'JRMSU-LIBRARY',
    systemTag: userType === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS',
    authCode: Math.random().toString().slice(2, 8),
    encryptedToken: btoa(`test-${userId}-${timestamp}`),
    timestamp: timestamp
  };
  
  return userData;
}

// Console utilities for testing
export async function testQRGeneration(): Promise<void> {
  console.log('🧪 Testing QR Code Generation...\n');
  
  const testUsers = [
    createTestUser('admin', 'KCL-00001'),
    createTestUser('student', 'KC-23-A-00243')
  ];
  
  for (const userData of testUsers) {
    console.log(`\n📋 Testing ${userData.userType}: ${userData.fullName}`);
    try {
      const qrDataUrl = await generateTestQR(userData);
      console.log('✅ QR generated successfully');
      console.log('📏 QR Data URL length:', qrDataUrl.length);
      console.log('📄 QR Content:', JSON.stringify(userData, null, 2));
    } catch (error) {
      console.log('❌ QR generation failed:', error);
    }
  }
  
  console.log('\n🏁 QR generation test completed!');
}

// Export to window for console access
(window as any).generateTestQR = generateTestQR;
(window as any).generateAndDisplayTestQR = generateAndDisplayTestQR;
(window as any).testQRGeneration = testQRGeneration;
(window as any).createTestUser = createTestUser;

export default generateTestQR;