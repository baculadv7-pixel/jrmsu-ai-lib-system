// Student API Service
// Backend endpoints for student user registration and profile management

export interface StudentRegistrationData {
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
  
  // Academic Information
  studentId: string;
  department: string;
  course: string;
  yearLevel: string;
  block?: string; // Extracted from Student ID
  
  // Security
  password: string;
}

export interface StudentProfileUpdateData {
  // Editable fields for students as per requirements
  
  // Personal Information (Editable)
  firstName?: string;
  middleName?: string;
  lastName?: string;
  suffix?: string;
  gender?: string;
  age?: string;
  birthday?: string;
  email?: string;
  phone?: string; // Contact Number
  
  // Academic Information (Editable)
  department?: string;
  course?: string;
  yearLevel?: string;
  block?: string;
  
  // Address Information (Current Address Editable)
  currentAddress?: string;
  currentRegion?: string;
  currentProvince?: string;
  currentMunicipality?: string;
  currentBarangay?: string;
  currentStreet?: string;
  currentZipCode?: string;
  currentLandmark?: string;
  
  // Permanent Address (Editable)
  permanentAddress?: string;
  region?: string;
  province?: string;
  municipality?: string;
  barangay?: string;
  street?: string;
  zipCode?: string;
}

class StudentApiService {
  private readonly BASE_URL = 'http://localhost:8080/api';
  
  /**
   * Extract block from Student ID format: KC-23-A-00762
   * Format: KATIPUNAN CAMPUS-SCHOOLYEAR-BLOCK-STUDENT ID REGISTER IN FIRSTYEAR
   */
  extractBlockFromStudentId(studentId: string): string {
    const match = studentId.match(/^KC-\d{2}-([A-F])-\d{5}$/);
    return match ? match[1] : '';
  }
  
  /**
   * Validate Student ID format
   */
  validateStudentId(studentId: string): { isValid: boolean; error?: string; block?: string } {
    const pattern = /^KC-\d{2}-[A-F]-\d{5}$/;
    
    if (!pattern.test(studentId)) {
      return {
        isValid: false,
        error: 'Student ID must follow format: KC-23-A-00762'
      };
    }
    
    const block = this.extractBlockFromStudentId(studentId);
    return {
      isValid: true,
      block
    };
  }
  
  /**
   * Register a new student user
   */
  async registerStudent(data: StudentRegistrationData): Promise<{ success: boolean; message: string; studentId?: string }> {
    try {
      // Validate Student ID and extract block
      const validation = this.validateStudentId(data.studentId);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid Student ID format');
      }
      
      const response = await fetch(`${this.BASE_URL}/student/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Map registration data to backend format
          role: 'student',
          studentId: data.studentId,
          block: validation.block, // Extracted from Student ID
          
          // Academic information
          department: data.department,
          course: data.course,
          yearLevel: data.yearLevel,
          
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
          systemTag: 'JRMSU-KCS',
          userType: 'student',
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
        message: 'Student registered successfully',
        studentId: result.studentId || data.studentId
      };
      
    } catch (error: any) {
      console.error('Student registration error:', error);
      return {
        success: false,
        message: error.message || 'Failed to register student user'
      };
    }
  }
  
  /**
   * Update student profile (only allowed fields)
   */
  async updateStudentProfile(studentId: string, data: StudentProfileUpdateData): Promise<{ success: boolean; message: string }> {
    try {
      // Extract block from Student ID if it's being updated
      let updateData = { ...data };
      if (data.department || data.course || data.yearLevel) {
        // Get current student info to extract block
        const currentStudent = await this.getStudentProfile(studentId);
        if (currentStudent && currentStudent.id) {
          const validation = this.validateStudentId(currentStudent.id);
          if (validation.isValid) {
            updateData.block = validation.block;
          }
        }
      }
      
      const response = await fetch(`${this.BASE_URL}/student/profile/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          ...updateData,
          updatedAt: new Date().toISOString(),
          
          // Update full name if name fields are provided
          ...(data.firstName || data.middleName || data.lastName ? {
            fullName: `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''} ${data.suffix || ''}`.trim()
          } : {}),
          
          // Build complete current address if address fields are provided
          ...(data.currentRegion || data.currentProvince || data.currentMunicipality ? {
            currentAddress: [
              data.currentStreet,
              data.currentBarangay,
              data.currentMunicipality,
              data.currentProvince,
              data.currentRegion,
              'Philippines',
              data.currentZipCode
            ].filter(Boolean).join(', ') + (data.currentLandmark ? ` (${data.currentLandmark})` : '')
          } : {}),
          
          // Build permanent address if permanent address fields are provided
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
      console.error('Student profile update error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update student profile'
      };
    }
  }
  
  /**
   * Get student profile
   */
  async getStudentProfile(studentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.BASE_URL}/student/profile/${studentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch student profile');
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Get student profile error:', error);
      throw error;
    }
  }
  
  /**
   * Validate student credentials
   */
  async validateStudent(studentId: string, password: string): Promise<{ success: boolean; student?: any }> {
    try {
      const response = await fetch(`${this.BASE_URL}/student/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          password
        })
      });
      
      if (!response.ok) {
        return { success: false };
      }
      
      const student = await response.json();
      return {
        success: true,
        student
      };
      
    } catch (error) {
      console.error('Student validation error:', error);
      return { success: false };
    }
  }
  
  /**
   * Generate QR code for student
   */
  async generateStudentQR(studentId: string, force: boolean = false): Promise<{ success: boolean; qrCode?: string; qrData?: any }> {
    try {
      const response = await fetch(`${this.BASE_URL}/student/qr/${studentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          force,
          systemTag: 'JRMSU-KCS',
          userType: 'student'
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
      console.error('Student QR generation error:', error);
      return { success: false };
    }
  }
  
  /**
   * Get all students (for Student Management page)
   */
  async getAllStudents(): Promise<{ success: boolean; students?: any[] }> {
    try {
      const response = await fetch(`${this.BASE_URL}/students`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      
      const students = await response.json();
      return {
        success: true,
        students
      };
      
    } catch (error) {
      console.error('Get students error:', error);
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
  async syncWithLocalDatabase(studentData: any): Promise<void> {
    try {
      // Import database service dynamically to avoid circular dependencies
      const { databaseService } = await import('./database');
      
      const result = databaseService.createUser({
        id: studentData.studentId,
        firstName: studentData.firstName,
        middleName: studentData.middleName,
        lastName: studentData.lastName,
        fullName: studentData.fullName,
        email: studentData.email,
        userType: 'student',
        course: studentData.course,
        year: studentData.yearLevel,
        section: studentData.block,
        department: studentData.department,
        phone: studentData.phone,
        gender: studentData.gender,
        birthday: studentData.birthdate,
        age: studentData.age,
        address: studentData.address,
        passwordHash: studentData.passwordHash,
        twoFactorEnabled: false,
        qrCodeActive: true,
        systemTag: 'JRMSU-KCS',
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

export const studentApiService = new StudentApiService();