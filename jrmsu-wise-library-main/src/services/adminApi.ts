// Admin API Service
// Backend endpoints for admin user registration and profile management

export interface AdminRegistrationData {
  // Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  suffix?: string;
  age: string;
  birthdate: string;
  gender: string;
  email: string;
  phone: string;
  
  // Address Information
  addressRegion: string;
  addressProvince: string;
  addressMunicipality: string;
  addressBarangay: string;
  addressStreet?: string;
  addressCountry: string;
  addressZip: string;
  
  // Permanent Address
  addressPermanent: string;
  sameAsCurrent?: boolean;
  addressPermanentNotes?: string;
  permanentAddressStreet?: string;
  permanentAddressBarangay?: string;
  permanentAddressMunicipality?: string;
  permanentAddressProvince?: string;
  permanentAddressRegion?: string;
  permanentAddressCountry?: string;
  permanentAddressZip?: string;
  
  // Admin Information
  adminId: string;
  position: string;
  
  // Security
  password: string;
}

export interface AdminProfileUpdateData {
  // Editable fields for admin
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  gender?: string;
  age?: string;
  birthday?: string;
  email?: string;
  phone?: string;
  
  // Address fields
  region?: string;
  province?: string;
  municipality?: string;
  barangay?: string;
  street?: string;
  zipCode?: string;
  
  // Current address
  currentAddress?: string;
  currentRegion?: string;
  currentProvince?: string;
  currentMunicipality?: string;
  currentBarangay?: string;
  currentStreet?: string;
  currentZipCode?: string;
  currentLandmark?: string;
}

class AdminApiService {
  private readonly BASE_URL = 'http://localhost:8080/api';
  
  /**
   * Register a new admin user
   */
  async registerAdmin(data: AdminRegistrationData): Promise<{ success: boolean; message: string; adminId?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Map registration data to backend format
          role: 'admin',
          adminId: data.adminId,
          position: data.position,
          
          // Personal information
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          suffix: data.suffix,
          fullName: `${data.firstName} ${data.middleName} ${data.lastName} ${data.suffix || ''}`.trim(),
          age: data.age,
          birthdate: data.birthdate,
          gender: data.gender,
          email: data.email,
          phone: data.phone,
          
          // Address information
          region: data.addressRegion,
          province: data.addressProvince,
          municipality: data.addressMunicipality,
          barangay: data.addressBarangay,
          street: data.addressStreet,
          country: data.addressCountry,
          zipCode: data.addressZip,
          
          // Complete address string
          address: [
            data.addressStreet,
            data.addressBarangay,
            data.addressMunicipality,
            data.addressProvince,
            data.addressRegion,
            data.addressCountry,
            data.addressZip
          ].filter(Boolean).join(', '),
          
          // Permanent address
          permanentAddress: data.addressPermanent,
          permanentAddressNotes: data.addressPermanentNotes,
          sameAsCurrent: data.sameAsCurrent,
          
          // Security
          passwordHash: this.hashPassword(data.password),
          
          // System fields
          systemTag: 'JRMSU-KCL',
          userType: 'admin',
          twoFactorEnabled: false,
          qrCodeActive: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      const result = await response.json();
      return {
        success: true,
        message: 'Admin registered successfully',
        adminId: result.adminId || data.adminId
      };
      
    } catch (error: any) {
      console.error('Admin registration error:', error);
      return {
        success: false,
        message: error.message || 'Failed to register admin user'
      };
    }
  }
  
  /**
   * Update admin profile
   */
  async updateAdminProfile(adminId: string, data: AdminProfileUpdateData): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/profile/${adminId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          ...data,
          updatedAt: new Date().toISOString(),
          // Update full name if name fields are provided
          ...(data.firstName || data.middleName || data.lastName ? {
            fullName: `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''} ${data.suffix || ''}`.trim()
          } : {}),
          // Build complete address if address fields are provided
          ...(data.region || data.province || data.municipality ? {
            address: [
              data.street,
              data.barangay,
              data.municipality,
              data.province,
              data.region,
              'Philippines',
              data.zipCode
            ].filter(Boolean).join(', ')
          } : {})
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Profile update failed');
      }
      
      return {
        success: true,
        message: 'Profile updated successfully'
      };
      
    } catch (error: any) {
      console.error('Admin profile update error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update admin profile'
      };
    }
  }
  
  /**
   * Get admin profile
   */
  async getAdminProfile(adminId: string): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/profile/${adminId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin profile');
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Get admin profile error:', error);
      throw error;
    }
  }
  
  /**
   * Validate admin credentials
   */
  async validateAdmin(adminId: string, password: string): Promise<{ success: boolean; admin?: any }> {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adminId,
          password
        })
      });
      
      if (!response.ok) {
        return { success: false };
      }
      
      const admin = await response.json();
      return {
        success: true,
        admin
      };
      
    } catch (error) {
      console.error('Admin validation error:', error);
      return { success: false };
    }
  }
  
  /**
   * Generate QR code for admin
   */
  async generateAdminQR(adminId: string, force: boolean = false): Promise<{ success: boolean; qrCode?: string; qrData?: any }> {
    try {
      const response = await fetch(`${this.BASE_URL}/admin/qr/${adminId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          force,
          systemTag: 'JRMSU-KCL',
          userType: 'admin'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      
      const result = await response.json();
      return {
        success: true,
        qrCode: result.qrCode,
        qrData: result.qrData
      };
      
    } catch (error) {
      console.error('Admin QR generation error:', error);
      return { success: false };
    }
  }
  
  /**
   * Simple password hashing (use proper bcrypt in production)
   */
  private hashPassword(password: string): string {
    // For demo purposes - use proper bcrypt in production
    return btoa(`jrmsu_salt_${password}_${Date.now()}`);
  }
  
  /**
   * Sync with existing database service
   */
  async syncWithLocalDatabase(adminData: any): Promise<void> {
    try {
      // Import database service dynamically to avoid circular dependencies
      const { databaseService } = await import('./database');
      
      const result = databaseService.createUser({
        id: adminData.adminId,
        firstName: adminData.firstName,
        middleName: adminData.middleName,
        lastName: adminData.lastName,
        fullName: adminData.fullName,
        email: adminData.email,
        userType: 'admin',
        role: adminData.position,
        phone: adminData.phone,
        gender: adminData.gender,
        birthday: adminData.birthdate,
        age: adminData.age,
        address: adminData.address,
        passwordHash: adminData.passwordHash,
        twoFactorEnabled: false,
        qrCodeActive: true,
        systemTag: 'JRMSU-KCL',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      });
      
      if (!result.success) {
        console.warn('Failed to sync with local database:', result.error);
      }
      
    } catch (error) {
      console.error('Database sync error:', error);
    }
  }
}

export const adminApiService = new AdminApiService();