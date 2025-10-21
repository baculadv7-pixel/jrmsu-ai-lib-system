// Unified Database Service for JRMSU Library System
// Handles both manual login and QR code authentication

export interface User {
  id: string; // User ID (KC-23-A-00243 for students, KCL-00001 for admins)
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  email: string;
  userType: "admin" | "student";
  
  // Student-specific fields
  course?: string;
  year?: string;
  section?: string;
  
  // Admin-specific fields
  department?: string;
  role?: string;
  
  // Authentication
  passwordHash: string; // Encrypted password
  twoFactorEnabled: boolean;
  twoFactorKey?: string; // Google Authenticator key
  
  // QR Code data
  qrCodeData?: string; // Generated QR code JSON
  qrCodeGeneratedAt?: Date;
  qrCodeActive: boolean;
  
  // System fields
  systemTag: "JRMSU-KCL" | "JRMSU-KCS"; // Admin or Student tag
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  
  // Profile
  profilePicture?: string; // Base64 or URL
  phone?: string;
  address?: string;
}

export interface LoginRecord {
  id: string;
  userId: string;
  method: "MANUAL" | "QR_CODE" | "QR_CODE_2FA";
  timestamp: Date;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
}

// Mock database using localStorage - In production, replace with actual database
class DatabaseService {
  private readonly USERS_KEY = 'jrmsu_users_db';
  private readonly LOGIN_RECORDS_KEY = 'jrmsu_login_records';
  
  // Initialize with sample users
  constructor() {
    this.initializeSampleData();
  }
  
  private initializeSampleData() {
    const existingUsers = this.getAllUsers();
    if (existingUsers.length === 0) {
      console.log('🔧 Initializing sample user database...');
      
      const sampleUsers: User[] = [
        // Sample Admin Users
        {
          id: "KCL-00001",
          firstName: "John",
          middleName: "Mark",
          lastName: "Santos",
          fullName: "John Mark Santos",
          email: "john.santos@jrmsu.edu.ph",
          userType: "admin",
          department: "Information Technology",
          role: "System Administrator",
          passwordHash: this.hashPassword("admin123"), // Simple hash for demo
          twoFactorEnabled: false,
          qrCodeActive: true,
          systemTag: "JRMSU-KCL",
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date(),
          isActive: true
        },
        {
          id: "KCL-00045",
          firstName: "Maria",
          middleName: "Clara",
          lastName: "Lopez",
          fullName: "Maria Clara Lopez",
          email: "maria.admin@jrmsu.edu.ph",
          userType: "admin",
          department: "Library Services",
          role: "Head Librarian",
          passwordHash: this.hashPassword("maria123"),
          twoFactorEnabled: true,
          twoFactorKey: "DEMO2FA123456",
          qrCodeActive: true,
          systemTag: "JRMSU-KCL",
          createdAt: new Date('2024-02-01'),
          updatedAt: new Date(),
          isActive: true
        },
        
        // Sample Student Users
        {
          id: "KC-23-A-00243",
          firstName: "Juan",
          middleName: "Miguel",
          lastName: "Dela Cruz",
          fullName: "Juan Miguel Dela Cruz",
          email: "juan.delacruz@jrmsu.edu.ph",
          userType: "student",
          course: "BSCS",
          year: "4th Year",
          section: "A",
          passwordHash: this.hashPassword("student123"),
          twoFactorEnabled: false,
          qrCodeActive: true,
          systemTag: "JRMSU-KCS",
          createdAt: new Date('2023-08-15'),
          updatedAt: new Date(),
          isActive: true
        },
        {
          id: "KC-24-A-12345",
          firstName: "Ana",
          middleName: "Marie",
          lastName: "Santos",
          fullName: "Ana Marie Santos",
          email: "ana.santos@jrmsu.edu.ph",
          userType: "student",
          course: "BSIT",
          year: "3rd Year",
          section: "B",
          passwordHash: this.hashPassword("ana123"),
          twoFactorEnabled: false, // 🔓 2FA DISABLED for testing
          twoFactorKey: undefined, // No 2FA key needed
          qrCodeActive: true,
          systemTag: "JRMSU-KCS",
          createdAt: new Date('2024-08-20'),
          updatedAt: new Date(),
          isActive: true
        }
      ];
      
      this.saveUsers(sampleUsers);
      console.log(`✅ Sample database initialized with ${sampleUsers.length} users`);
    }
  }
  
  // Simple password hashing (use proper encryption in production)
  private hashPassword(password: string): string {
    // Simple base64 encoding for demo - use bcrypt or similar in production
    return btoa(`jrmsu_salt_${password}_${Date.now()}`);
  }
  
  private verifyPassword(password: string, hash: string): boolean {
    // Simple verification for demo
    try {
      const decoded = atob(hash);
      return decoded.includes(password);
    } catch {
      return false;
    }
  }
  
  // User CRUD operations
  getAllUsers(): User[] {
    try {
      const users = localStorage.getItem(this.USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }
  
  getUserById(id: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.id === id) || null;
  }
  
  getUserByEmail(email: string): User | null {
    const users = this.getAllUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
  }
  
  private saveUsers(users: User[]): void {
    try {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users:', error);
    }
  }
  
  // Authentication methods
  authenticateUser(id: string, password: string): { success: boolean; user?: User; error?: string } {
    const user = this.getUserById(id);
    
    if (!user) {
      return { success: false, error: "User not found" };
    }
    
    if (!user.isActive) {
      return { success: false, error: "Account is deactivated" };
    }
    
    if (!this.verifyPassword(password, user.passwordHash)) {
      return { success: false, error: "Invalid password" };
    }
    
    // Log successful authentication
    this.logLogin({
      userId: user.id,
      method: "MANUAL",
      success: true,
      timestamp: new Date()
    });
    
    return { success: true, user };
  }
  
  authenticateWithQRCode(qrData: any): { success: boolean; user?: User; error?: string } {
    console.log('📋 ======== DATABASE QR AUTHENTICATION START ========');
    console.log('🔍 Received QR data keys:', Object.keys(qrData));
    console.log('🔍 Full QR data:', JSON.stringify(qrData, null, 2));
    console.log('🔍 QR Authentication - Data analysis:', {
      userId: qrData.userId,
      userType: qrData.userType,
      systemId: qrData.systemId,
      systemTag: qrData.systemTag,
      fullName: qrData.fullName,
      hasSessionToken: !!qrData.sessionToken,
      hasLegacyAuth: !!(qrData.authCode || qrData.encryptedToken),
      timestamp: qrData.timestamp,
      timestampAge: qrData.timestamp ? ((Date.now() - qrData.timestamp) / 1000 / 60).toFixed(1) + ' minutes' : 'N/A'
    });
    
    console.log('🔄 Step 1: Validating required fields...');
    
    // Validate QR data structure - check for required fields (new streamlined structure)
    const requiredFields = {
      userId: !!qrData.userId,
      systemTag: !!qrData.systemTag,
      fullName: !!qrData.fullName,
      systemId: !!qrData.systemId,
      userType: !!qrData.userType,
      role: !!qrData.role // NEW: Validate role field for accuracy
    };
    
    console.log('🔍 Required fields check:', requiredFields);
    
    if (!qrData.userId || !qrData.systemTag || !qrData.fullName || !qrData.systemId || !qrData.userType || !qrData.role) {
      const missing = Object.entries(requiredFields)
        .filter(([_, exists]) => !exists)
        .map(([field, _]) => field);
      console.error('❌ Missing required fields:', missing);
      return { success: false, error: `Invalid QR code data - missing required fields: ${missing.join(', ')}` };
    }
    
    console.log('✅ Step 1 passed: All required fields present');
    console.log('🔄 Step 2: Validating system ID...');
    
    // Validate system ID
    if (qrData.systemId !== "JRMSU-LIBRARY") {
      console.error('❌ Invalid system ID:', qrData.systemId);
      return { success: false, error: "Invalid QR code - not a JRMSU Library System code" };
    }
    
    console.log('✅ Step 2 passed: System ID is valid');
    console.log('🔄 Step 3: Validating authentication token...');
    
    // Validate authentication - support sessionToken (always present in new structure)
    if (!qrData.sessionToken) {
      console.warn('⚠️ QR Code missing sessionToken - checking legacy fields...');
      const hasLegacyAuth = qrData.authCode || qrData.realTimeAuthCode || qrData.encryptedToken || qrData.encryptedPasswordToken;
      console.log('🔍 Legacy auth check:', {
        authCode: !!qrData.authCode,
        realTimeAuthCode: !!qrData.realTimeAuthCode,
        encryptedToken: !!qrData.encryptedToken,
        encryptedPasswordToken: !!qrData.encryptedPasswordToken,
        hasAnyLegacyAuth: hasLegacyAuth
      });
      if (!hasLegacyAuth) {
        console.error('❌ No authentication token found (sessionToken or legacy fields)');
        return { success: false, error: "Invalid QR code - missing authentication token" };
      }
    }
    
    console.log('✅ Step 3 passed: Authentication token present');
    
    console.log('🔄 Step 4: Looking up user in database...');
    console.log('🔍 Searching for user ID:', qrData.userId);
    
    const user = this.getUserById(qrData.userId);
    
    if (!user) {
      console.error('❌ User not found in database:', qrData.userId);
      // List all available users for debugging
      const allUsers = this.getAllUsers();
      console.log('🔍 Available users in database:', allUsers.map(u => ({ id: u.id, fullName: u.fullName, userType: u.userType })));
      return { success: false, error: "User not found" };
    }
    
    console.log('✅ Step 4 passed: User found in database');
    console.log('🔍 Database user:', {
      id: user.id,
      fullName: user.fullName,
      userType: user.userType,
      isActive: user.isActive,
      qrCodeActive: user.qrCodeActive
    });
    
    console.log('🔄 Step 5: Validating user account status...');
    
    if (!user.isActive || !user.qrCodeActive) {
      console.error('❌ User account or QR code is deactivated:', {
        isActive: user.isActive,
        qrCodeActive: user.qrCodeActive
      });
      return { success: false, error: "QR code is deactivated" };
    }
    
    console.log('✅ Step 5 passed: User account is active');
    console.log('🔄 Step 6: Verifying system tag matches user type...');
    
    // Verify system tag matches user type
    const expectedTag = user.userType === "admin" ? "JRMSU-KCL" : "JRMSU-KCS";
    console.log('🔍 System tag verification:', {
      qrSystemTag: qrData.systemTag,
      expectedTag: expectedTag,
      userType: user.userType,
      matches: qrData.systemTag === expectedTag
    });
    
    if (qrData.systemTag !== expectedTag) {
      console.error('❌ System tag mismatch:', {
        expected: expectedTag,
        received: qrData.systemTag
      });
      return { success: false, error: "Invalid QR code system tag" };
    }
    
    console.log('✅ Step 6 passed: System tag matches user type');
    console.log('🔄 Step 7: Verifying full name matches...');
    
    // Verify full name matches
    console.log('🔍 Name comparison:', {
      qrFullName: qrData.fullName,
      dbFullName: user.fullName,
      matches: qrData.fullName === user.fullName
    });
    
    if (qrData.fullName !== user.fullName) {
      console.error('❌ Full name mismatch:', {
        qrName: qrData.fullName,
        dbName: user.fullName
      });
      return { success: false, error: "QR code user data mismatch" };
    }
    
    console.log('✅ Step 7 passed: Full name matches');
    console.log('🔄 Step 8: Verifying user type matches...');
    
    // Verify user type matches
    console.log('🔍 User type comparison:', {
      qrUserType: qrData.userType,
      dbUserType: user.userType,
      matches: qrData.userType === user.userType
    });
    
    if (qrData.userType !== user.userType) {
      console.error('❌ User type mismatch:', {
        qrType: qrData.userType,
        dbType: user.userType
      });
      return { success: false, error: "QR code user type mismatch" };
    }
    
    console.log('✅ Step 8 passed: User type matches');
    console.log('🔄 Step 9: Verifying role matches user type...');
    
    // Verify role matches user type (NEW: Added for accuracy)
    const expectedRole = user.userType === 'admin' ? 'Administrator' : 'Student';
    console.log('🔍 Role comparison:', {
      qrRole: qrData.role,
      expectedRole: expectedRole,
      userType: user.userType,
      matches: qrData.role === expectedRole
    });
    
    if (qrData.role !== expectedRole) {
      console.error('❌ Role mismatch:', {
        qrRole: qrData.role,
        expectedRole: expectedRole
      });
      return { success: false, error: "QR code role mismatch" };
    }
    
    console.log('✅ Step 9 passed: Role matches user type');
    
    // Check timestamp for expiration (QR codes expire after 30 minutes)
    if (qrData.timestamp) {
      const qrTimestamp = qrData.timestamp;
      const currentTime = Date.now();
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
      
      if (currentTime - qrTimestamp > thirtyMinutes) {
        return { success: false, error: "QR code has expired - please generate a new one" };
      }
    }
    
    // 🔓 2FA DISABLED FOR TESTING - Skip 2FA verification
    console.log('🔓 2FA authentication disabled for testing');
    
    console.log('✅ Step 10: All validations passed - authentication SUCCESS!');
    console.log('🔄 Step 11: Logging successful authentication...');
    
    // Log successful QR authentication
    this.logLogin({
      userId: user.id,
      method: "QR_CODE_FORCED", // Always use QR_CODE since 2FA is disabled
      success: true,
      timestamp: new Date()
    });
    
    console.log('✅ ======== DATABASE QR AUTHENTICATION SUCCESS ========');
    console.log('🎉 Returning user for login:', {
      id: user.id,
      fullName: user.fullName,
      userType: user.userType
    });
    
    return { success: true, user };
  }
  
  // User management
  createUser(userData: Partial<User>): { success: boolean; user?: User; error?: string } {
    if (!userData.id || !userData.firstName || !userData.email || !userData.userType) {
      return { success: false, error: "Missing required fields" };
    }
    
    const existingUser = this.getUserById(userData.id);
    if (existingUser) {
      return { success: false, error: "User ID already exists" };
    }
    
    const emailUser = this.getUserByEmail(userData.email);
    if (emailUser) {
      return { success: false, error: "Email already registered" };
    }
    
    const newUser: User = {
      id: userData.id,
      firstName: userData.firstName,
      middleName: userData.middleName,
      lastName: userData.lastName || "",
      fullName: userData.fullName || `${userData.firstName} ${userData.lastName || ""}`.trim(),
      email: userData.email,
      userType: userData.userType,
      course: userData.course,
      year: userData.year,
      section: userData.section,
      department: userData.department,
      role: userData.role,
      passwordHash: userData.passwordHash || this.hashPassword("defaultpass123"),
      twoFactorEnabled: userData.twoFactorEnabled || false,
      twoFactorKey: userData.twoFactorKey,
      qrCodeActive: true,
      systemTag: userData.userType === "admin" ? "JRMSU-KCL" : "JRMSU-KCS",
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      profilePicture: userData.profilePicture,
      phone: userData.phone,
      address: userData.address
    };
    
    const users = this.getAllUsers();
    users.push(newUser);
    this.saveUsers(users);
    
    return { success: true, user: newUser };
  }
  
  updateUser(id: string, updates: Partial<User>): { success: boolean; user?: User; error?: string } {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return { success: false, error: "User not found" };
    }
    
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date()
    };
    
    this.saveUsers(users);
    return { success: true, user: users[userIndex] };
  }
  
  deleteUser(id: string): { success: boolean; error?: string } {
    const users = this.getAllUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return { success: false, error: "User not found" };
    }
    
    users.splice(userIndex, 1);
    this.saveUsers(users);
    return { success: true };
  }
  
  // Login logging
  private logLogin(record: Omit<LoginRecord, 'id'>): void {
    try {
      const loginRecord: LoginRecord = {
        id: `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...record
      };
      
      const records = this.getLoginRecords();
      records.push(loginRecord);
      
      // Keep only last 1000 records
      const trimmedRecords = records.slice(-1000);
      localStorage.setItem(this.LOGIN_RECORDS_KEY, JSON.stringify(trimmedRecords));
    } catch (error) {
      console.error('Error logging login:', error);
    }
  }
  
  getLoginRecords(userId?: string): LoginRecord[] {
    try {
      const records = localStorage.getItem(this.LOGIN_RECORDS_KEY);
      const allRecords = records ? JSON.parse(records) : [];
      
      if (userId) {
        return allRecords.filter((record: LoginRecord) => record.userId === userId);
      }
      
      return allRecords;
    } catch (error) {
      console.error('Error loading login records:', error);
      return [];
    }
  }
  
  // Filter methods for management pages
  getStudents(): User[] {
    return this.getAllUsers().filter(user => user.userType === "student");
  }
  
  getAdmins(): User[] {
    return this.getAllUsers().filter(user => user.userType === "admin");
  }
  
  // Search and sorting
  searchUsers(query: string, userType?: "admin" | "student"): User[] {
    const users = userType ? 
      this.getAllUsers().filter(user => user.userType === userType) : 
      this.getAllUsers();
    
    const lowerQuery = query.toLowerCase();
    return users.filter(user =>
      user.fullName.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery) ||
      user.id.toLowerCase().includes(lowerQuery) ||
      (user.course && user.course.toLowerCase().includes(lowerQuery)) ||
      (user.department && user.department.toLowerCase().includes(lowerQuery))
    );
  }
  
  sortUsers(users: User[], sortBy: 'name' | 'id' | 'email' | 'created', order: 'asc' | 'desc' = 'asc'): User[] {
    return users.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortBy) {
        case 'name':
          compareValue = a.fullName.localeCompare(b.fullName);
          break;
        case 'id':
          compareValue = a.id.localeCompare(b.id);
          break;
        case 'email':
          compareValue = a.email.localeCompare(b.email);
          break;
        case 'created':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return order === 'asc' ? compareValue : -compareValue;
    });
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();