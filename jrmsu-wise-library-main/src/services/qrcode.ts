import QRCode from 'qrcode';

export interface QRCodeData {
  fullName: string;
  userId: string;
  userType: "admin" | "student";
  department?: string;
  course?: string;
  year?: string;
  role?: string;
  encryptedPasswordToken: string;
  twoFactorSetupKey: string;
  systemTag: string;
}

class QRCodeService {
  /**
   * Generate QR code as data URL for display in components
   */
  async generateQRCode(data: QRCodeData): Promise<string> {
    try {
      // Create QR code data structure
      const qrData = {
        fullName: data.fullName,
        userId: data.userId,
        userType: data.userType,
        department: data.department || data.course,
        role: data.role || `${data.course} - Year ${data.year}`,
        encryptedPasswordToken: data.encryptedPasswordToken,
        twoFactorSetupKey: data.twoFactorSetupKey,
        systemTag: data.systemTag,
        systemId: "JRMSU-LIBRARY"
      };

      // Convert to JSON string
      const qrString = JSON.stringify(qrData);

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
        width: 256,
        height: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' // Medium error correction = fewer modules while remaining reliable
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as Canvas for more advanced manipulation
   */
  async generateQRCodeCanvas(data: QRCodeData): Promise<HTMLCanvasElement> {
    try {
      const qrData = {
        fullName: data.fullName,
        userId: data.userId,
        userType: data.userType,
        department: data.department || data.course,
        role: data.role || `${data.course} - Year ${data.year}`,
        encryptedPasswordToken: data.encryptedPasswordToken,
        twoFactorSetupKey: data.twoFactorSetupKey,
        systemTag: data.systemTag,
        systemId: "JRMSU-LIBRARY"
      };

      const qrString = JSON.stringify(qrData);
      
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrString, {
        width: 256,
        height: 256,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M' // Medium error correction = fewer modules while remaining reliable
      });

      return canvas;
    } catch (error) {
      console.error('Error generating QR code canvas:', error);
      throw new Error('Failed to generate QR code canvas');
    }
  }

  /**
   * Validate QR code data structure
   */
  validateQRData(data: QRCodeData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.fullName?.trim()) {
      errors.push('Full name is required');
    }

    if (!data.userId?.trim()) {
      errors.push('User ID is required');
    }

    if (!data.userType || !['admin', 'student'].includes(data.userType)) {
      errors.push('Valid user type is required');
    }

    if (!data.encryptedPasswordToken?.trim()) {
      errors.push('Encrypted password token is required');
    }

    if (!data.twoFactorSetupKey?.trim()) {
      errors.push('Two-factor setup key is required');
    }


    if (!data.systemTag?.trim()) {
      errors.push('System tag is required');
    }

    // Validate user ID format
    const userIdPattern = data.userType === 'student' 
      ? /^KC-\d{2}-[A-D]-\d{5}$/ 
      : /^KCL-\d{5}$/;
    
    if (data.userId && !userIdPattern.test(data.userId)) {
      errors.push(`Invalid ${data.userType} ID format`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate secure tokens for QR code
   */
  generateSecureTokens(): {
    encryptedPasswordToken: string;
    twoFactorSetupKey: string;
    realTimeAuthCode: string;
  } {
    return {
      encryptedPasswordToken: this.generateRandomString(32),
      twoFactorSetupKey: this.generateRandomString(16)
    };
  }

  /**
   * Generate random string for tokens
   */
  private generateRandomString(length: number, numbersOnly: boolean = false): string {
    const charset = numbersOnly 
      ? '0123456789'
      : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }
}

export const qrCodeService = new QRCodeService();
export default qrCodeService;