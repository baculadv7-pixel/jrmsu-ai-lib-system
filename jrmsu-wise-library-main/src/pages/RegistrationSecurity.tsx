import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useRegistration } from "@/context/RegistrationContext";
import { useMemo, useState } from "react";
import { Eye, EyeOff, CheckCircle2, Loader2, QrCode } from "lucide-react";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { toast } from "@/hooks/use-toast";
import { databaseService } from "@/services/database";
import { adminApiService, type AdminRegistrationData } from "@/services/adminApi";
import { studentApiService, type StudentRegistrationData } from "@/services/studentApi";

const RegistrationSecurity = () => {
  const navigate = useNavigate();
  const { data, update, reset } = useRegistration();
  const [showPwd, setShowPwd] = useState(false);
  const [showCpwd, setShowCpwd] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Password validation
  const passwordValid = useMemo(() => {
    const pwd = data.password || "";
    return pwd.length >= 8 && /[A-Z]/.test(pwd) && /\d/.test(pwd);
  }, [data.password]);

  const passwordsMatch = useMemo(() => {
    return data.password && data.confirmPassword && data.password === data.confirmPassword;
  }, [data.password, data.confirmPassword]);

  const allValid = useMemo(() => {
    return passwordValid && passwordsMatch;
  }, [passwordValid, passwordsMatch]);

  // Generate QR Code data with proper structure for scanner compatibility
  const generateQRCode = () => {
    const userId = data.role === "student" ? data.studentId : data.adminId;
    const fullName = `${data.firstName} ${data.middleName || ''} ${data.lastName}`.replace(/\s+/g, ' ').trim();
    
    const qrData = {
      // Required fields matching QRLoginData interface
      fullName: fullName,
      userId: userId,
      userType: data.role as "admin" | "student",
      authCode: Math.random().toString().slice(2, 8),
      encryptedToken: btoa(`${userId}-${Date.now()}`),
      
      // Optional fields
      twoFactorKey: undefined, // Will be set when 2FA is enabled
      department: data.department,
      course: data.course,
      year: data.year,
      section: data.section,
      position: data.position,
      role: data.role === "admin" ? "Administrator" : "Student",
      
      // System fields
      systemTag: data.role === "student" ? "JRMSU-KCS" : "JRMSU-KCL",
      systemId: "JRMSU-LIBRARY",
      timestamp: Date.now(),
      
      // Legacy compatibility fields
      realTimeAuthCode: Math.random().toString().slice(2, 8),
      encryptedPasswordToken: btoa(`${userId}-${Date.now()}`),
      twoFactorSetupKey: undefined
    };
    
    return JSON.stringify(qrData);
  };

  const handleFinish = async () => {
    if (!allValid) {
      setShowErrors(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('🔧 Starting user registration process...', {
        role: data.role,
        id: data.role === "student" ? data.studentId : data.adminId,
        name: `${data.firstName} ${data.lastName}`
      });
      
      // Create user in database
      const userId = data.role === "student" ? data.studentId : data.adminId;
      
      const userData = {
        id: userId,
        firstName: data.firstName,
        middleName: data.middleName || undefined,
        lastName: data.lastName,
        fullName: `${data.firstName} ${data.middleName || ''} ${data.lastName}`.replace(/\s+/g, ' ').trim(),
        email: data.email,
        userType: data.role as "admin" | "student",
        
        // Student-specific fields
        course: data.role === "student" ? data.course : undefined,
        year: data.role === "student" ? data.yearLevel : undefined,
        section: data.role === "student" ? data.block : undefined,
        
        // Admin-specific fields
        role: data.role === "admin" ? data.position : undefined,
        
        // Authentication - hash the password properly in production
        passwordHash: btoa(`jrmsu_salt_${data.password}_${Date.now()}`), // Simple demo hash
        twoFactorEnabled: false,
        
        // Profile data
        phone: data.phone,
        gender: data.gender,
        birthday: data.birthdate,
        age: data.age,
        
        // Address data - comprehensive
        address: [
          data.addressStreet,
          data.addressBarangay,
          data.addressMunicipality,
          data.addressProvince,
          data.addressRegion,
          data.addressCountry,
          data.addressZip
        ].filter(Boolean).join(', ') || undefined,
        
        // Additional address fields for admin profile editing
        street: data.addressStreet,
        barangay: data.addressBarangay,
        municipality: data.addressMunicipality,
        province: data.addressProvince,
        region: data.addressRegion,
        country: data.addressCountry,
        zipCode: data.addressZip,
        
        // Permanent address
        permanentAddress: data.addressPermanent,
        permanentAddressNotes: data.addressPermanentNotes,
        sameAsCurrent: data.sameAsCurrent
      };
      
      // Handle admin registration with enhanced API
      if (data.role === 'admin') {
        const adminData: AdminRegistrationData = {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          suffix: data.suffix,
          age: data.age,
          birthdate: data.birthdate,
          gender: data.gender || '',
          email: data.email,
          phone: data.phone,
          
          addressRegion: data.addressRegion || '',
          addressProvince: data.addressProvince || '',
          addressMunicipality: data.addressMunicipality || '',
          addressBarangay: data.addressBarangay || '',
          addressStreet: data.addressStreet,
          addressCountry: data.addressCountry || 'Philippines',
          addressZip: data.addressZip || '',
          
          addressPermanent: data.addressPermanent || '',
          sameAsCurrent: data.sameAsCurrent,
          addressPermanentNotes: data.addressPermanentNotes,
          permanentAddressStreet: data.permanentAddressStreet,
          permanentAddressBarangay: data.permanentAddressBarangay,
          permanentAddressMunicipality: data.permanentAddressMunicipality,
          permanentAddressProvince: data.permanentAddressProvince,
          permanentAddressRegion: data.permanentAddressRegion,
          permanentAddressCountry: data.permanentAddressCountry || 'Philippines',
          permanentAddressZip: data.permanentAddressZip,
          
          adminId: data.adminId || '',
          position: data.position || '',
          password: data.password || ''
        };
        
        const apiResult = await adminApiService.registerAdmin(adminData);
        
        if (!apiResult.success) {
          throw new Error(apiResult.message || "Failed to create admin account");
        }
        
        // Also sync with local database service
        await adminApiService.syncWithLocalDatabase({
          adminId: data.adminId,
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          fullName: userData.fullName,
          email: data.email,
          position: data.position,
          phone: data.phone,
          gender: data.gender,
          birthdate: data.birthdate,
          age: data.age,
          address: userData.address,
          passwordHash: userData.passwordHash
        });
        
        console.log('✅ Admin registered successfully:', data.adminId);
        
      } else {
        // Handle student registration with enhanced API
        const studentData: StudentRegistrationData = {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          suffix: data.suffix,
          age: data.age,
          birthdate: data.birthdate,
          gender: data.gender || '',
          email: data.email,
          phone: data.phone,
          
          addressRegion: data.addressRegion || '',
          addressProvince: data.addressProvince || '',
          addressMunicipality: data.addressMunicipality || '',
          addressBarangay: data.addressBarangay || '',
          addressStreet: data.addressStreet,
          addressCountry: data.addressCountry || 'Philippines',
          addressZip: data.addressZip || '',
          
          addressPermanent: data.addressPermanent || '',
          sameAsCurrent: data.sameAsCurrent,
          addressPermanentNotes: data.addressPermanentNotes,
          permanentAddressStreet: data.permanentAddressStreet,
          permanentAddressBarangay: data.permanentAddressBarangay,
          permanentAddressMunicipality: data.permanentAddressMunicipality,
          permanentAddressProvince: data.permanentAddressProvince,
          permanentAddressRegion: data.permanentAddressRegion,
          permanentAddressCountry: data.permanentAddressCountry || 'Philippines',
          permanentAddressZip: data.permanentAddressZip,
          
          studentId: data.studentId || '',
          department: data.department || '',
          course: data.course || '',
          yearLevel: data.yearLevel || '',
          block: data.block || studentApiService.extractBlockFromStudentId(data.studentId || ''),
          password: data.password || ''
        };
        
        const apiResult = await studentApiService.registerStudent(studentData);
        
        if (!apiResult.success) {
          throw new Error(apiResult.message || "Failed to create student account");
        }
        
        // Also sync with local database service
        await studentApiService.syncWithLocalDatabase({
          studentId: data.studentId,
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          fullName: userData.fullName,
          email: data.email,
          department: data.department,
          course: data.course,
          yearLevel: data.yearLevel,
          block: studentData.block,
          phone: data.phone,
          gender: data.gender,
          birthdate: data.birthdate,
          age: data.age,
          address: userData.address,
          passwordHash: userData.passwordHash
        });
        
        console.log('✅ Student registered successfully:', data.studentId);
      }

      try {
        // Also persist to Python backend for global sync
        await fetch('http://localhost:5000/api/users/' + encodeURIComponent(userId), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData)
        });
      } catch {}
      
      // Generate QR Code with enhanced data
      const qrCode = generateQRCode();
      
      // Show success state
      setShowSuccess(true);
      
      toast({
        title: "✅ Registration Successful!",
        description: `Your JRMSU account has been created successfully. Welcome, ${data.firstName}!`,
        duration: 3000
      });
      
      // Wait 2 seconds then redirect to allow user to see success
      setTimeout(() => {
        reset();
        navigate("/", { 
          state: { 
            message: "Registration completed successfully. You can now log in with your credentials.",
            newUser: userId 
          }
        });
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      
      let errorMessage = "Something went wrong during registration. Please try again.";
      
      if (error.message?.includes("already exists")) {
        errorMessage = "An account with this ID or email already exists. Please use different credentials.";
      } else if (error.message?.includes("Missing required fields")) {
        errorMessage = "Please fill in all required fields and try again.";
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 4000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl shadow-jrmsu-gold text-center">
          <CardContent className="pt-6">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">Registration Successful!</h2>
            <p className="text-muted-foreground mb-4">Your JRMSU QR Code has been generated.</p>
            <div className="bg-muted p-4 rounded-lg mb-4">
              <QrCode className="h-24 w-24 mx-auto mb-2" />
              <p className="text-sm font-mono">{data.role === "student" ? "JRMSU-KCS" : "JRMSU-KCL"}</p>
              <p className="text-xs text-muted-foreground">QR Code generated successfully</p>
            </div>
            <p className="text-sm text-muted-foreground">Redirecting to login page...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-jrmsu-gold">
        <CardHeader>
          <NavigationProgress currentStep={4} totalSteps={4} />
          <CardTitle className="text-2xl text-primary mt-4">Phase 4 of 4: Security & Account Setup</CardTitle>
          <CardDescription>Create a secure password to complete your registration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="pwd">Password *</Label>
            <div className="relative">
              <Input 
                id="pwd" 
                type={showPwd ? "text" : "password"} 
                value={data.password || ""} 
                onChange={(e) => update({ password: e.target.value })}
                className={showErrors && !passwordValid ? "border-destructive" : ""}
              />
              <button 
                type="button" 
                onClick={() => setShowPwd(v => !v)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" 
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {showErrors && !passwordValid && (
              <p className="text-xs text-destructive">
                ⚠️ Password must be at least 8 characters with uppercase letter and number.
              </p>
            )}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li className={data.password && data.password.length >= 8 ? "text-green-600" : ""}>
                  Minimum 8 characters
                </li>
                <li className={data.password && /[A-Z]/.test(data.password) ? "text-green-600" : ""}>
                  At least one uppercase letter
                </li>
                <li className={data.password && /\d/.test(data.password) ? "text-green-600" : ""}>
                  At least one number
                </li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="cpwd">Confirm Password *</Label>
            <div className="relative">
              <Input 
                id="cpwd" 
                type={showCpwd ? "text" : "password"} 
                value={data.confirmPassword || ""} 
                onChange={(e) => update({ confirmPassword: e.target.value })}
                className={showErrors && !passwordsMatch && data.confirmPassword ? "border-destructive" : ""}
              />
              <button 
                type="button" 
                onClick={() => setShowCpwd(v => !v)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" 
                aria-label={showCpwd ? "Hide password" : "Show password"}
              >
                {showCpwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {showErrors && !passwordsMatch && data.confirmPassword && (
              <p className="text-xs text-destructive">⚠️ Passwords do not match.</p>
            )}
          </div>

          {/* QR Code Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <QrCode className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-primary">Automatic QR Code Generation</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Upon successful registration, a unique JRMSU QR Code will be generated containing:
            </p>
            <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
              <li>Your profile information and ID</li>
              <li>Encrypted authentication key</li>
              <li>System login token</li>
              <li>Logo: {data.role === "student" ? "JRMSU-KCS (Students)" : "JRMSU-KCL (Library Admin)"}</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={() => navigate("/register/institution")}>
              Back
            </Button>
            <Button 
              onClick={handleFinish}
              disabled={!allValid || isSubmitting}
              className={!allValid ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-primary hover:bg-primary/90"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Finish"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationSecurity;


