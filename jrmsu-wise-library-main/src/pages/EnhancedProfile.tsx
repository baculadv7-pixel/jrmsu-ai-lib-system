import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QrCode, Download, Shield, RotateCcw, Edit, Save, X } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import QRCodeDisplay, { downloadCanvasAsPng } from "@/components/qr/QRCodeDisplay";
import { ProfilePicture } from "@/components/profile/ProfilePicture";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { generateUserQR } from "@/services/qr";
import { databaseService } from "@/services/database";
import { ActivityService } from "@/services/activity";
import { NotificationsService } from "@/services/notifications";
import { pythonApi } from "@/services/pythonApi";

const EnhancedProfile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const userType = user?.role || "student";
  const [qrEnvelope, setQrEnvelope] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  // Form state for editable fields
  const [formData, setFormData] = useState({
    // Student-editable fields (seed from user if available)
    department: (user?.department as any) || "",
    course: user?.course || "",
    yearLevel: (user?.year as any) || "",
    block: (user?.section as any) || "",
    currentAddress: (user?.address as any) || "",
    // Profile picture
    profilePicture: (user?.profilePicture as any) || "",
    
    // Admin-editable fields
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    suffix: (user as any)?.suffix || "",
    gender: (user as any)?.gender || "",
    age: (user as any)?.age || "",
    birthday: (user as any)?.birthday || "",
    email: user?.email || "",
    contactNumber: (user as any)?.phone || (user as any)?.contact || "",
    
    // Address fields - Permanent
    permanentRegion: (user as any)?.region || "",
    permanentProvince: (user as any)?.province || "",
    permanentMunicipality: (user as any)?.municipality || "",
    permanentBarangay: (user as any)?.barangay || "",
    permanentStreet: (user as any)?.street || "",
    permanentZipCode: (user as any)?.zipCode || "",
    
    // Address fields - Current (for admin)
    currentRegion: userType === "admin" ? (user as any)?.currentRegion || "" : "",
    currentProvince: userType === "admin" ? (user as any)?.currentProvince || "" : "",
    currentMunicipality: userType === "admin" ? (user as any)?.currentMunicipality || "" : "",
    currentBarangay: userType === "admin" ? (user as any)?.currentBarangay || "" : "",
    currentStreet: userType === "admin" ? (user as any)?.currentStreet || "" : "",
    currentZipCode: userType === "admin" ? (user as any)?.currentZipCode || "" : "",
    currentLandmark: userType === "admin" ? (user as any)?.currentLandmark || "" : ""
  });

  useEffect(() => {
    if (user?.id) {
      (async () => {
        try {
          // load full profile from backend then generate QR
          try {
            const r = await pythonApi.getUser(user.id);
            if (r) {
              try { updateUser(r); } catch {}
              setFormData(prev => ({
                ...prev,
                // Personal information
                firstName: r.firstName ?? prev.firstName,
                middleName: r.middleName ?? prev.middleName,
                lastName: r.lastName ?? prev.lastName,
                suffix: r.suffix ?? prev.suffix,
                gender: r.gender ?? prev.gender,
                age: r.age ?? prev.age,
                birthday: r.birthday ?? prev.birthday,
                email: r.email ?? prev.email,
                contactNumber: r.phone ?? r.contact ?? prev.contactNumber,
                // Academic information (students)
                department: r.department ?? prev.department,
                course: r.course ?? prev.course,
                yearLevel: r.year ?? prev.yearLevel,
                block: r.section ?? prev.block,
                currentAddress: r.address ?? prev.currentAddress,
                profilePicture: r.profilePicture ?? prev.profilePicture,
                // Permanent address
                permanentRegion: r.region ?? prev.permanentRegion,
                permanentProvince: r.province ?? prev.permanentProvince,
                permanentMunicipality: r.municipality ?? prev.permanentMunicipality,
                permanentBarangay: r.barangay ?? prev.permanentBarangay,
                permanentStreet: r.street ?? prev.permanentStreet,
                permanentZipCode: r.zipCode ?? prev.permanentZipCode,
                // Current address
                currentRegion: r.currentRegion ?? prev.currentRegion,
                currentProvince: r.currentProvince ?? prev.currentProvince,
                currentMunicipality: r.currentMunicipality ?? prev.currentMunicipality,
                currentBarangay: r.currentBarangay ?? prev.currentBarangay,
                currentStreet: r.currentStreet ?? prev.currentStreet,
                currentZipCode: r.currentZipCode ?? prev.currentZipCode,
                currentLandmark: r.currentLandmark ?? prev.currentLandmark,
              }));
            }
          } catch {}
          const resp = await generateUserQR({ userId: user.id });
          setQrEnvelope(resp.envelope);
        } catch (error) {
          console.error('Failed to generate QR code:', error);
          // Fallback: Generate QR manually with required structure (no 2FA/real-time codes)
          const fallbackQRData = JSON.stringify({
            fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            userId: user.id,
            userType: user.role,
            systemId: 'JRMSU-LIBRARY',
            systemTag: user.role === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS',
            timestamp: Date.now(),
            encryptedPasswordToken: btoa(`${user.id}-${Date.now()}`),
            email: user.email
          });
          setQrEnvelope(fallbackQRData);
        }
      })();
    }
  }, [user?.id, user?.role]);

  // Build user data from authenticated session and formData (prioritize formData after backend load)
  const userData = {
    firstName: formData.firstName || user?.firstName || '',
    middleName: formData.middleName || user?.middleName || '',
    lastName: formData.lastName || user?.lastName || '',
    suffix: formData.suffix || (user as any)?.suffix || '',
    gender: formData.gender || (user as any)?.gender || '',
    birthday: formData.birthday || (user as any)?.birthday || '',
    age: formData.age || (user as any)?.age || '',
    id: user?.id || '',
    // Position/job title for admin: fallback to role if position missing
    position: userType === 'admin' ? (((user as any)?.position) || (user as any)?.role || '') : undefined,
    email: formData.email || user?.email || '',
    contact: formData.contactNumber || (user as any)?.phone || (user as any)?.contact || '',
    // Student department
    department: formData.department || (user as any)?.department || '',
    street: (user as any)?.street || '',
    barangay: (user as any)?.barangay || '',
    municipality: (user as any)?.municipality || '',
    province: (user as any)?.province || '',
    region: (user as any)?.region || '',
    country: (user as any)?.country || '',
    zipCode: (user as any)?.zipCode || '',
    addressFull: (user as any)?.address || ''
  } as const;

  const userInitials = `${(userData.firstName||'?')[0] || ''}${(userData.lastName||'?')[0] || ''}`.toUpperCase();

  const canEdit = Boolean(user);

  // Department and course options
  const departments = [
    "College of Computer Science",
    "College of Engineering",
    "College of Arts and Sciences",
    "College of Business Administration",
    "College of Education"
  ];

  const coursesByDepartment: { [key: string]: string[] } = {
    "College of Computer Science": [
      "Bachelor of Science in Information Technology",
      "Bachelor of Science in Computer Science",
      "Bachelor of Science in Information Systems"
    ],
    "College of Engineering": [
      "Bachelor of Science in Civil Engineering",
      "Bachelor of Science in Electrical Engineering",
      "Bachelor of Science in Mechanical Engineering"
    ],
    // Add more departments and courses as needed
  };

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
  const blocks = ["A", "B", "C", "D"];

const handleSave = async () => {
    // Persist to database and session
    if (!user?.id) return;
    
    const updates: any = {
      // Common personal fields (editable for both student and admin)
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      suffix: formData.suffix,
      gender: formData.gender,
      age: formData.age,
      birthday: formData.birthday,
      email: formData.email,
      phone: formData.contactNumber,
      contact: formData.contactNumber,
      // Student academic fields
      department: formData.department,
      course: formData.course,
      year: formData.yearLevel,
      section: formData.block,
      address: formData.currentAddress,
      profilePicture: formData.profilePicture,
      // Current address (editable for both)
      currentRegion: formData.currentRegion,
      currentProvince: formData.currentProvince,
      currentMunicipality: formData.currentMunicipality,
      currentBarangay: formData.currentBarangay,
      currentStreet: formData.currentStreet,
      currentZipCode: formData.currentZipCode,
      currentLandmark: formData.currentLandmark,
    };
    
    // Admin-specific fields
    if (userType === "admin") {
      
      // Permanent Address fields
      updates.region = formData.permanentRegion;
      updates.province = formData.permanentProvince;
      updates.municipality = formData.permanentMunicipality;
      updates.barangay = formData.permanentBarangay;
      updates.street = formData.permanentStreet;
      updates.zipCode = formData.permanentZipCode;
      
      // Current Address fields (individual for backend)
      updates.currentRegion = formData.currentRegion;
      updates.currentProvince = formData.currentProvince;
      updates.currentMunicipality = formData.currentMunicipality;
      updates.currentBarangay = formData.currentBarangay;
      updates.currentStreet = formData.currentStreet;
      updates.currentZipCode = formData.currentZipCode;
      updates.currentLandmark = formData.currentLandmark;
      
      // Update full name
      const fullNameParts = [formData.firstName, formData.middleName, formData.lastName, formData.suffix].filter(Boolean);
      if (fullNameParts.length > 0) {
        updates.fullName = fullNameParts.join(' ');
      }
    }
const res = databaseService.updateUser(user.id, updates);
    try { await pythonApi.updateUser(user.id, updates); } catch {}
    ActivityService.log(user.id, 'profile_update');
    NotificationsService.add({ receiverId: user.id, type: 'system', message: 'Profile updated successfully.' });
    // Sync auth session
    try {
      const raw = localStorage.getItem('jrmsu_auth_session');
      if (raw) {
        const sess = JSON.parse(raw);
        const next = { ...sess, ...updates };
        localStorage.setItem('jrmsu_auth_session', JSON.stringify(next));
      }
    } catch {}
    // Update in-memory auth user for immediate UI sync
    try { updateUser(updates); } catch {}
    setIsEditing(false);
    toast({ title: "Profile updated successfully", description: "Your profile information has been saved." });
  };

  const handleCancel = () => {
    // Reset form data to original values
    setIsEditing(false);
  };

  const handleProfilePictureChange = (file: File) => {
    // In a real app, upload to server and get URL
    const mockUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, profilePicture: mockUrl }));
  };

  const handleProfilePictureRemove = () => {
    setFormData(prev => ({ ...prev, profilePicture: "" }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        userType={userType} 
        theme={theme} 
        onThemeChange={setTheme}
      />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">Profile</h1>
                <p className="text-muted-foreground mt-1">
                  {userType === "admin" 
                    ? "View and manage your admin account information" 
                    : "View your information and update editable fields"}
                </p>
              </div>
              
              {/* Edit Button - for both admin and student */}
              {canEdit && (
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture & QR Code Section */}
              <div className="space-y-6">
                {/* Profile Picture */}
                <Card className="shadow-jrmsu">
                  <CardHeader>
                    <CardTitle className="text-center">Profile Picture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ProfilePicture
                      currentImage={formData.profilePicture}
                      userInitials={userInitials}
                      canRemove={userType === "admin"}
                      onImageChange={handleProfilePictureChange}
                      onImageRemove={handleProfilePictureRemove}
                    />
                  </CardContent>
                </Card>

                {/* QR Code Section */}
                <Card className="shadow-jrmsu">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      QR Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center">
                      <div className="h-48 w-48 rounded-lg flex items-center justify-center bg-white">
                        <QRCodeDisplay 
                          data={qrEnvelope || "{}"} 
                          size={192} 
                          centerLabel={userType === "admin" ? "JRMSU–KCL" : "JRMSU–KCS"} 
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const container = document.querySelector("main .h-48.w-48");
                          const canvas = container?.querySelector("canvas") as HTMLCanvasElement;
                          if (canvas) {
downloadCanvasAsPng(canvas, "user-qr.png");
                            if (user?.id) { ActivityService.log(user.id, 'qr_download'); NotificationsService.add({ receiverId: user.id, type: 'system', message: 'QR code downloaded.' }); }
                          }
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download QR
                      </Button>
                      <Button
                        variant="outline"
                        onClick={async () => {
                          if (user?.id) {
                            try {
                              const resp = await generateUserQR({ userId: user.id, rotate: true });
setQrEnvelope(resp.envelope);
                              ActivityService.log(user.id, 'qr_regenerate');
                              NotificationsService.add({ receiverId: user.id, type: 'system', message: 'QR code regenerated.' });
                            } catch (error) {
                              console.error('Failed to regenerate QR code:', error);
                              // Fallback: Generate new QR manually with EXACT structure matching database
                              const fallbackQRData = JSON.stringify({
                                fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                                userId: user.id,
                                userType: user.role,
                                systemId: 'JRMSU-LIBRARY',
                                systemTag: user.role === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS',
                                timestamp: Date.now(),
                                sessionToken: btoa(`${user.id}-${Date.now()}`),
                                role: user.role === 'admin' ? 'Administrator' : 'Student',
                                
                                // RESTORE 2FA setup key for Google Authenticator
                                ...(user.twoFactorKey ? {
                                  twoFactorKey: user.twoFactorKey,
                                  twoFactorSetupKey: user.twoFactorKey
                                } : {})
                              });
                              setQrEnvelope(fallbackQRData);
                            }
                          }
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Regenerate
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Use this QR code for quick library access
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Personal Information */}
              <Card className="lg:col-span-2 shadow-jrmsu">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {userType === "student" && "✨ Some fields are read-only for security"}
                    {userType === "admin" && "Admin can edit most information except ID"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Full Name</Label>
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <Input 
                              placeholder="First Name"
                              value={formData.firstName || userData.firstName}
                              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                              className="text-sm"
                            />
                            <Input 
                              placeholder="Middle Name"
                              value={formData.middleName || userData.middleName}
                              onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                              className="text-sm"
                            />
                            <Input 
                              placeholder="Last Name"
                              value={formData.lastName || userData.lastName}
                              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                              className="text-sm"
                            />
                          </div>
                          <Input 
                            placeholder="Suffix (Jr., Sr., II)"
                            value={formData.suffix || userData.suffix || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, suffix: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      ) : (
                        <>
                          <p className="font-medium p-2 bg-muted/50 rounded">
                            {userData.firstName} {userData.middleName} {userData.lastName} {userData.suffix}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Editable</p>
                        </>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">
                        {userType === "admin" ? "Admin ID" : "Student ID"}
                      </Label>
                      <p className="font-medium p-2 bg-muted/50 rounded">{userData.id}</p>
                      <p className="text-xs text-muted-foreground mt-1">Read-only</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Gender</Label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={formData.gender === "Male" ? "default" : "outline"}
                            className="flex-1 text-sm"
                            onClick={() => setFormData(prev => ({ ...prev, gender: "Male" }))}
                          >
                            Male
                          </Button>
                          <Button
                            type="button"
                            variant={formData.gender === "Female" ? "default" : "outline"}
                            className="flex-1 text-sm"
                            onClick={() => setFormData(prev => ({ ...prev, gender: "Female" }))}
                          >
                            Female
                          </Button>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium p-2 bg-muted/50 rounded">{userData.gender}</p>
                          <p className="text-xs text-muted-foreground mt-1">Editable</p>
                        </>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Age</Label>
                      {isEditing ? (
                        <Input 
                          type="number"
                          min="16"
                          max="100"
                          value={formData.age || userData.age}
                          onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                          className="text-sm"
                        />
                      ) : (
                        <>
                          <p className="font-medium p-2 bg-muted/50 rounded">{userData.age}</p>
                          <p className="text-xs text-muted-foreground mt-1">Editable</p>
                        </>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Birthday</Label>
                      {isEditing ? (
                        <Input 
                          type="date"
                          value={formData.birthday || userData.birthday}
                          onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                          className="text-sm"
                        />
                      ) : (
                        <>
                          <p className="font-medium p-2 bg-muted/50 rounded">{userData.birthday}</p>
                          <p className="text-xs text-muted-foreground mt-1">Editable</p>
                        </>
                      )}
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email Address</Label>
                      {isEditing ? (
                        <Input 
                          type="email"
                          value={formData.email || userData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="text-sm"
                        />
                      ) : (
                        <>
                          <p className="font-medium p-2 bg-muted/50 rounded">{userData.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">Editable</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student-specific Academic Information (Editable) */}
            {userType === "student" && (
              <Card className="shadow-jrmsu border-blue-200 bg-blue-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-blue-600" />
                    Academic Information
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      Editable
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      {isEditing ? (
                        <Select 
                          value={formData.department} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cte">Teacher Education</SelectItem>
                            <SelectItem value="cba">Business Administration</SelectItem>
                            <SelectItem value="cafse">Agriculture & Forestry</SelectItem>
                            <SelectItem value="scje">Criminal Justice Education</SelectItem>
                            <SelectItem value="ccs">Computing Studies</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium p-2 bg-white/70 rounded border">{formData.department || userData.department || 'Not specified'}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Course</Label>
                      {isEditing ? (
                        <Select 
                          value={formData.course} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, course: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.department === "cte" && (
                              <>
                                <SelectItem value="bsfil">BS Filipino</SelectItem>
                                <SelectItem value="bssci">BS Science</SelectItem>
                                <SelectItem value="bsee">BS Elementary Ed</SelectItem>
                                <SelectItem value="bsmath">BS Math</SelectItem>
                                <SelectItem value="bspe">BS PE</SelectItem>
                              </>
                            )}
                            {formData.department === "cba" && (
                              <>
                                <SelectItem value="bhm">BS Hospitality Management</SelectItem>
                                <SelectItem value="bbahrm">BSBA – HR Management</SelectItem>
                                <SelectItem value="bsab">BS Agri-Business</SelectItem>
                              </>
                            )}
                            {formData.department === "cafse" && (
                              <>
                                <SelectItem value="bsa">BS Agriculture</SelectItem>
                                <SelectItem value="bsf">BS Forestry</SelectItem>
                                <SelectItem value="bsabe">BS Agri & Biosystems Eng.</SelectItem>
                              </>
                            )}
                            {formData.department === "scje" && (
                              <SelectItem value="none">No course required</SelectItem>
                            )}
                            {formData.department === "ccs" && (
                              <>
                                <SelectItem value="bsis">BS Information System</SelectItem>
                                <SelectItem value="bscs">BS Computer Science</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium p-2 bg-white/70 rounded border">{formData.course}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Year Level</Label>
                      {isEditing ? (
                        <Select 
                          value={formData.yearLevel} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, yearLevel: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1st Year</SelectItem>
                            <SelectItem value="2">2nd Year</SelectItem>
                            <SelectItem value="3">3rd Year</SelectItem>
                            <SelectItem value="4">4th Year</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium p-2 bg-white/70 rounded border">{formData.yearLevel}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Block</Label>
                      <p className="font-medium p-2 bg-muted/50 rounded">{(user as any)?.section || 'Not specified'}</p>
                      <p className="text-xs text-muted-foreground mt-1">Read-only (extracted from Student ID)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Position Information (Read-only) */}
            {userType === "admin" && (
              <Card className="shadow-jrmsu">
                <CardHeader>
                  <CardTitle>Position Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Position</Label>
                    <p className="font-medium p-2 bg-muted/50 rounded">{(userData as any).position}</p>
                    <p className="text-xs text-muted-foreground">Read-only</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            <Card className="shadow-jrmsu">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Contact Number</Label>
                    {isEditing ? (
                      <Input 
                        type="tel"
                        value={formData.contactNumber || userData.contact}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                        className="text-sm"
                        placeholder="09123456789"
                      />
                    ) : (
                      <>
                        <p className="font-medium p-2 bg-muted/50 rounded">{userData.contact}</p>
                        <p className="text-xs text-muted-foreground mt-1">Editable</p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="shadow-jrmsu border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Address Information
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {userType === "admin" ? "All Addresses Editable" : "Current Address Editable"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Permanent Address */}
                <div className="space-y-2">
                  <Label>Permanent Address</Label>
                  {isEditing ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Input
                          placeholder="Region"
                          value={formData.permanentRegion || userData.region || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanentRegion: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Province"
                          value={formData.permanentProvince || userData.province || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanentProvince: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Municipality/City"
                          value={formData.permanentMunicipality || userData.municipality || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanentMunicipality: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Country"
                          value="Philippines"
                          disabled
                          className="text-sm bg-muted/50"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Barangay"
                          value={formData.permanentBarangay || userData.barangay || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanentBarangay: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Street (Optional)"
                          value={formData.permanentStreet || userData.street || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanentStreet: e.target.value }))}
                          className="text-sm"
                        />
                        <Input
                          placeholder="Zip Code"
                          value={formData.permanentZipCode || userData.zipCode || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, permanentZipCode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium p-2 bg-white/70 rounded border">
                      {userData.addressFull || [userData.street, userData.barangay, userData.municipality, userData.province, userData.region, userData.country, userData.zipCode].filter(Boolean).join(', ') || 'No permanent address on file'}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Editable</p>
                </div>
                
                {/* Current Address Section for Admin */}
                {userType === "admin" && (
                  <div className="space-y-2">
                    <Label>Current Address</Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Input
                            placeholder="Region"
                            value={formData.currentRegion || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentRegion: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Province"
                            value={formData.currentProvince || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentProvince: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Municipality/City"
                            value={formData.currentMunicipality || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentMunicipality: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Country"
                            value="Philippines"
                            disabled
                            className="text-sm bg-muted/50"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Barangay"
                            value={formData.currentBarangay || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentBarangay: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Street (Optional)"
                            value={formData.currentStreet || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentStreet: e.target.value }))}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Zip Code"
                            value={formData.currentZipCode || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentZipCode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Landmark / Notes (Optional)</Label>
                          <Input
                            placeholder="near the church, in front of a sari-sari store"
                            value={formData.currentLandmark || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentLandmark: e.target.value }))}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium p-2 bg-white/70 rounded border">
                        {(user as any)?.currentAddress || [formData.currentStreet, formData.currentBarangay, formData.currentMunicipality, formData.currentProvince, formData.currentRegion, 'Philippines', formData.currentZipCode, formData.currentLandmark].filter(Boolean).join(', ') || 'No current address specified'}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Editable</p>
                  </div>
                )}
                
                {/* Current Address for Student - Enhanced */}
                {userType === "student" && (
                  <div className="space-y-2">
                    <Label>Current Address</Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Input
                            placeholder="Region"
                            value={formData.currentRegion || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentRegion: e.target.value }))}
                            className="text-sm bg-white/70"
                          />
                          <Input
                            placeholder="Province"
                            value={formData.currentProvince || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentProvince: e.target.value }))}
                            className="text-sm bg-white/70"
                          />
                          <Input
                            placeholder="Municipality/City"
                            value={formData.currentMunicipality || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentMunicipality: e.target.value }))}
                            className="text-sm bg-white/70"
                          />
                          <Input
                            placeholder="Country"
                            value="Philippines"
                            disabled
                            className="text-sm bg-muted/50"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="Barangay"
                            value={formData.currentBarangay || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentBarangay: e.target.value }))}
                            className="text-sm bg-white/70"
                          />
                          <Input
                            placeholder="Street (Optional)"
                            value={formData.currentStreet || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentStreet: e.target.value }))}
                            className="text-sm bg-white/70"
                          />
                          <Input
                            placeholder="Zip Code"
                            value={formData.currentZipCode || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentZipCode: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                            className="text-sm bg-white/70"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Landmark / Notes (Optional)</Label>
                          <Input
                            placeholder="near the church, in front of a sari-sari store"
                            value={formData.currentLandmark || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, currentLandmark: e.target.value }))}
                            className="text-sm bg-white/70"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="font-medium p-2 bg-white/70 rounded border">
                        {formData.currentAddress || 'No current address specified'}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Editable</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 2FA Settings */}
            <Card className="shadow-jrmsu">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">2FA Status</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Badge variant={user?.twoFactorEnabled ? "default" : "secondary"}>
                    {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                  Manage 2FA Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <AIAssistant />
    </div>
  );
};

export default EnhancedProfile;