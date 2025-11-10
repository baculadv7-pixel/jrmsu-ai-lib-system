// Enhanced QR Code Generator with Logo-Friendly Center Space
// This utility generates QR codes optimized for logo overlay while maintaining maximum readability

import QRCode from 'qrcode';
import { JRMSUQRCodeStructure } from './qr-structure-test';

export interface QRGenerationOptions {
  size: number;
  logoSize: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  includeLogo: boolean;
  logoUrl?: string;
  optimizeForScanning: boolean;
}

export const DEFAULT_QR_OPTIONS: QRGenerationOptions = {
  size: 300,
  logoSize: 60, // Optimal size for H-level error correction (20% of QR size)
  errorCorrectionLevel: 'H', // Highest error correction for logo compatibility
  margin: 4,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  includeLogo: false,
  logoUrl: '/jrmsu-logo.jpg',
  optimizeForScanning: true
};

/**
 * Generate enhanced QR code optimized for logo overlay
 */
export async function generateEnhancedQR(
  data: JRMSUQRCodeStructure | string,
  options: Partial<QRGenerationOptions> = {}
): Promise<string> {
  const config = { ...DEFAULT_QR_OPTIONS, ...options };
  
  const qrData = typeof data === 'string' ? data : JSON.stringify(data);
  
  try {
    // Generate base QR code with optimal settings for logo embedding
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: config.size,
      height: config.size,
      margin: config.margin,
      color: config.color,
      errorCorrectionLevel: config.errorCorrectionLevel,
      type: 'image/png',
      quality: 1.0,
      
      // Enhanced settings for better logo compatibility
      rendererOpts: {
        quality: 1.0
      }
    });

    if (!config.includeLogo) {
      return qrCodeDataUrl;
    }

    // Add logo overlay if requested
    return await addLogoOverlay(qrCodeDataUrl, config);
    
  } catch (error) {
    console.error('Enhanced QR generation failed:', error);
    throw new Error(`Failed to generate QR code: ${(error as Error).message}`);
  }
}

/**
 * Add logo overlay to QR code with optimal positioning
 */
async function addLogoOverlay(
  qrDataUrl: string,
  config: QRGenerationOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    canvas.width = config.size;
    canvas.height = config.size;

    const qrImage = new Image();
    qrImage.onload = () => {
      // Draw QR code
      ctx.drawImage(qrImage, 0, 0, config.size, config.size);

      if (config.logoUrl) {
        const logoImage = new Image();
        logoImage.onload = () => {
          // Calculate logo position (center)
          const logoX = (config.size - config.logoSize) / 2;
          const logoY = (config.size - config.logoSize) / 2;

          // Create white background for logo (improves contrast)
          const padding = 8;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(
            logoX - padding,
            logoY - padding,
            config.logoSize + (padding * 2),
            config.logoSize + (padding * 2)
          );

          // Draw logo
          ctx.drawImage(logoImage, logoX, logoY, config.logoSize, config.logoSize);

          // Convert to data URL
          resolve(canvas.toDataURL('image/png', 1.0));
        };

        logoImage.onerror = () => {
          console.warn('Logo failed to load, returning QR without logo');
          resolve(qrDataUrl);
        };

        logoImage.crossOrigin = 'anonymous';
        logoImage.src = config.logoUrl;
      } else {
        resolve(qrDataUrl);
      }
    };

    qrImage.onerror = () => {
      reject(new Error('Failed to load QR code image'));
    };

    qrImage.src = qrDataUrl;
  });
}

/**
 * Generate scanner-optimized QR code without logo for testing
 */
export async function generateScannerOptimizedQR(data: JRMSUQRCodeStructure | string): Promise<string> {
  return generateEnhancedQR(data, {
    size: 256,
    errorCorrectionLevel: 'H',
    includeLogo: false,
    optimizeForScanning: true
  });
}

/**
 * Generate display-optimized QR code with logo for UI
 */
export async function generateDisplayQR(data: JRMSUQRCodeStructure | string): Promise<string> {
  return generateEnhancedQR(data, {
    size: 300,
    logoSize: 60,
    errorCorrectionLevel: 'H',
    includeLogo: true,
    optimizeForScanning: true
  });
}

/**
 * Test QR code scannability by generating different variants
 */
export async function testQRScannability(data: JRMSUQRCodeStructure | string): Promise<{
  results: Array<{
    variant: string;
    dataUrl: string;
    size: number;
    hasLogo: boolean;
    errorCorrection: string;
  }>;
  recommendations: string[];
}> {
  const results = [];
  const recommendations = [];

  // Test different configurations
  const configs = [
    { name: 'Scanner Optimized (No Logo)', size: 256, logo: false, ec: 'H' as const },
    { name: 'Display with Small Logo', size: 300, logo: true, logoSize: 45, ec: 'H' as const },
    { name: 'Display with Medium Logo', size: 300, logo: true, logoSize: 60, ec: 'H' as const },
    { name: 'Large Display with Logo', size: 400, logo: true, logoSize: 80, ec: 'H' as const }
  ];

  for (const config of configs) {
    try {
      const dataUrl = await generateEnhancedQR(data, {
        size: config.size,
        logoSize: config.logoSize || 60,
        errorCorrectionLevel: config.ec,
        includeLogo: config.logo
      });

      results.push({
        variant: config.name,
        dataUrl,
        size: config.size,
        hasLogo: config.logo,
        errorCorrection: config.ec
      });

      // Generate recommendations
      if (!config.logo) {
        recommendations.push(`${config.name}: Best for scanning reliability`);
      } else if (config.logoSize && config.logoSize <= 60) {
        recommendations.push(`${config.name}: Good balance of branding and scannability`);
      }
    } catch (error) {
      console.error(`Failed to generate ${config.name}:`, error);
    }
  }

  return { results, recommendations };
}

/**
 * Validate QR code readability score (theoretical)
 */
export function calculateReadabilityScore(options: QRGenerationOptions): {
  score: number; // 0-100
  factors: Array<{
    factor: string;
    score: number;
    weight: number;
    description: string;
  }>;
} {
  const factors = [
    {
      factor: 'Error Correction Level',
      score: options.errorCorrectionLevel === 'H' ? 100 : 
             options.errorCorrectionLevel === 'Q' ? 75 :
             options.errorCorrectionLevel === 'M' ? 50 : 25,
      weight: 0.3,
      description: 'Higher error correction allows for more logo interference'
    },
    {
      factor: 'Logo Size',
      score: !options.includeLogo ? 100 :
             options.logoSize <= 50 ? 90 :
             options.logoSize <= 70 ? 75 :
             options.logoSize <= 90 ? 50 : 25,
      weight: 0.25,
      description: 'Smaller logos interfere less with QR code data'
    },
    {
      factor: 'QR Code Size',
      score: options.size >= 300 ? 100 :
             options.size >= 250 ? 85 :
             options.size >= 200 ? 70 : 50,
      weight: 0.2,
      description: 'Larger QR codes are easier for cameras to read'
    },
    {
      factor: 'Contrast',
      score: options.color.dark === '#000000' && options.color.light === '#FFFFFF' ? 100 : 75,
      weight: 0.15,
      description: 'High contrast (black/white) provides best scanning results'
    },
    {
      factor: 'Margin',
      score: options.margin >= 4 ? 100 : options.margin >= 2 ? 75 : 50,
      weight: 0.1,
      description: 'Adequate margin helps scanners detect QR boundaries'
    }
  ];

  const weightedScore = factors.reduce((total, factor) => {
    return total + (factor.score * factor.weight);
  }, 0);

  return {
    score: Math.round(weightedScore),
    factors
  };
}

/**
 * Console utilities for testing QR generation
 */
export async function testQRGeneration(): Promise<void> {
  console.group('🎯 Enhanced QR Code Generation Test');

  try {
    // Generate test data
    const testData = {
      fullName: 'Test User',
      userId: 'KC-24-A-00001',
      userType: 'student' as const,
      authCode: '123456',
      encryptedToken: btoa('test-token'),
      systemId: 'JRMSU-LIBRARY' as const,
      timestamp: Date.now(),
      systemTag: 'JRMSU-KCS' as const
    };

    console.log('📋 Test Data:', testData);

    // Test different QR variants
    const scannerOptimized = await generateScannerOptimizedQR(testData);
    const displayOptimized = await generateDisplayQR(testData);

    console.log('✅ Scanner-optimized QR generated (no logo)');
    console.log('✅ Display-optimized QR generated (with logo)');

    // Calculate readability scores
    const scannerScore = calculateReadabilityScore({
      ...DEFAULT_QR_OPTIONS,
      includeLogo: false,
      size: 256
    });

    const displayScore = calculateReadabilityScore({
      ...DEFAULT_QR_OPTIONS,
      includeLogo: true,
      size: 300,
      logoSize: 60
    });

    console.log('\n📊 Readability Scores:');
    console.log(`Scanner-optimized: ${scannerScore.score}/100`);
    console.log(`Display with logo: ${displayScore.score}/100`);

    console.log('\n🎯 Recommendations:');
    console.log('- Use scanner-optimized version for testing detection');
    console.log('- Use display version for user interfaces');
    console.log('- Both versions use H-level error correction for maximum compatibility');

    console.groupEnd();

  } catch (error) {
    console.error('❌ QR generation test failed:', error);
    console.groupEnd();
  }
}

// Export to window for console access
(window as any).generateEnhancedQR = generateEnhancedQR;
(window as any).generateScannerOptimizedQR = generateScannerOptimizedQR;
(window as any).generateDisplayQR = generateDisplayQR;
(window as any).testQRScannability = testQRScannability;
(window as any).testQRGeneration = testQRGeneration;
(window as any).calculateReadabilityScore = calculateReadabilityScore;

export default {
  generateEnhancedQR,
  generateScannerOptimizedQR,
  generateDisplayQR,
  testQRScannability,
  testQRGeneration,
  calculateReadabilityScore
};