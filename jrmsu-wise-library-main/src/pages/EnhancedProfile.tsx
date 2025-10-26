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
    profilePicture: (user?.profilePicture as any) || ""
  });

  useEffect(() => {
    if (user?.id) {
      (async () => {
        try {
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

  // Build user data from authenticated session (no mock values)
  const userData = {
    firstName: user?.firstName || '',
    middleName: user?.middleName || '',
    lastName: user?.lastName || '',
    suffix: '',
    gender: (user as any)?.gender || '',
    birthday: (user as any)?.birthday || '',
    age: (user as any)?.age || '',
    id: user?.id || '',
    // Use position/job title from profile, not auth role
    position: userType === 'admin' ? ((user as any)?.position || '') : undefined,
    email: user?.email || '',
    contact: user?.phone || '',
    street: (user as any)?.street || '',
    barangay: (user as any)?.barangay || '',
    municipality: (user as any)?.municipality || '',
    province: (user as any)?.province || '',
    country: (user as any)?.country || '',
    zipCode: (user as any)?.zipCode || ''
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

  const handleSave = () => {
    // Persist to database and session
    if (!user?.id) return;
    const updates: any = {
      department: formData.department,
      course: formData.course,
      year: formData.yearLevel,
      section: formData.block,
      address: formData.currentAddress,
      profilePicture: formData.profilePicture,
    };
const res = databaseService.updateUser(user.id, updates);
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
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Full Name</Label>
                      <p className="font-medium p-2 bg-muted/50 rounded">
                        {userData.firstName} {userData.middleName} {userData.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Read-only</p>
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
                      <p className="font-medium p-2 bg-muted/50 rounded">{userData.gender}</p>
                      <p className="text-xs text-muted-foreground mt-1">Read-only</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Age</Label>
                      <p className="font-medium p-2 bg-muted/50 rounded">{userData.age}</p>
                      <p className="text-xs text-muted-foreground mt-1">Read-only</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Birthday</Label>
                      <p className="font-medium p-2 bg-muted/50 rounded">{userData.birthday}</p>
                      <p className="text-xs text-muted-foreground mt-1">Read-only</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email Address</Label>
                      <p className="font-medium p-2 bg-muted/50 rounded">{userData.email}</p>
                      <p className="text-xs text-muted-foreground mt-1">Read-only</p>
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
                            {departments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium p-2 bg-white/70 rounded border">{formData.department}</p>
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
                            {(coursesByDepartment[formData.department] || []).map(course => (
                              <SelectItem key={course} value={course}>{course}</SelectItem>
                            ))}
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
                            {yearLevels.map(year => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium p-2 bg-white/70 rounded border">{formData.yearLevel}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Block</Label>
                      {isEditing ? (
                        <Select 
                          value={formData.block} 
                          onValueChange={(value) => setFormData(prev => ({ ...prev, block: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {blocks.map(block => (
                              <SelectItem key={block} value={block}>{block}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="font-medium p-2 bg-white/70 rounded border">{formData.block}</p>
                      )}
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
                    <p className="font-medium p-2 bg-muted/50 rounded">{userData.contact}</p>
                    <p className="text-xs text-muted-foreground mt-1">Read-only</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="shadow-jrmsu border-green-200 bg-green-50/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Address Information
                  {userType === "student" && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Current Address Editable
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Address</Label>
                  {isEditing && userType === "student" ? (
                    <Input
                      value={formData.currentAddress}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentAddress: e.target.value }))}
                      className="bg-white/70"
                    />
                  ) : (
                    <p className="font-medium p-2 bg-white/70 rounded border">
                      {userType === "student" ? formData.currentAddress : 
                        `${userData.street}, ${userData.barangay}, ${userData.municipality}, ${userData.province}, ${userData.country} ${userData.zipCode}`
                      }
                    </p>
                  )}
                  {userType === "admin" && (
                    <p className="text-xs text-muted-foreground mt-1">Read-only</p>
                  )}
                </div>
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