import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  User as UserIcon, 
  Upload, 
  Download, 
  RefreshCw, 
  Save, 
  X, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap,
  IdCard,
  QrCode,
  Camera,
  AlertCircle,
  CheckCircle,
  Edit,
  Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { databaseService, User } from "@/services/database";
import { qrCodeService } from "@/services/qrcode";
import { QRCodeSVG } from "qrcode.react";
import Admin2FAOverlay from "@/components/settings/Admin2FAOverlay";
import { ActivityService } from "@/services/activity";
import { NotificationsService } from "@/services/notifications";
import { Eye, EyeOff } from "lucide-react";

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: User;
  onSave: (updatedStudent: User) => void;
}

export function StudentProfileModal({ isOpen, onClose, student, onSave }: StudentProfileModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegeneratingQR, setIsRegeneratingQR] = useState(false);
  const [editedStudent, setEditedStudent] = useState<User>(student);
  const [profileImage, setProfileImage] = useState<string | null>(student.profilePicture || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open2FA, setOpen2FA] = useState(false);
  const [showPwReset, setShowPwReset] = useState(false);
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  // Profile picture upload handler
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, JPEG, or PNG image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfileImage(result);
      setEditedStudent(prev => ({ ...prev, profilePicture: result }));
    };
    reader.readAsDataURL(file);

    toast({
      title: "Image uploaded",
      description: "Profile picture updated. Don't forget to save your changes.",
    });
  }, [toast]);

  // Generate and download QR code
  const handleDownloadQR = useCallback(() => {
    const canvas = document.createElement('canvas');
    const svg = document.querySelector('#student-qr-code svg') as SVGElement;
    
    if (!svg) {
      toast({
        title: "QR Code not found",
        description: "Unable to download QR code. Please try again.",
        variant: "destructive"
      });
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Create download link
        const link = document.createElement('a');
        link.download = `${student.id}_QR_Code.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        toast({
          title: "QR Code downloaded",
          description: `QR code saved as ${student.id}_QR_Code.png`,
        });
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }, [student.id, toast]);

  // Regenerate QR code
  const handleRegenerateQR = useCallback(async () => {
    setIsRegeneratingQR(true);
    try {
      // Simulate QR regeneration process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "QR Code regenerated",
        description: "A new QR code has been generated for this student.",
      });
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: "Failed to regenerate QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRegeneratingQR(false);
    }
  }, [toast]);

  // Save changes
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // Update user in database
      const updateResult = databaseService.updateUser(student.id, editedStudent);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to update student");
      }
      
      // Update local state
      onSave(updateResult.user!);
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: "Student profile has been successfully updated.",
      });
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Update failed",
        description: "Failed to update student profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [editedStudent, student.id, onSave, toast]);

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedStudent(student);
    setProfileImage(student.profilePicture || null);
    setIsEditing(false);
  };

  // Generate QR code data for display
  const generateQRData = () => {
    // Generate secure tokens if they don't exist
    const secureTokens = qrCodeService.generateSecureTokens();
    
    return JSON.stringify({
      fullName: student.fullName,
      userId: student.id,
      userType: student.userType,
      department: student.course,
      course: student.course,
      year: student.year,
      role: "Student",
      authCode: student.realTimeAuthCode || secureTokens.realTimeAuthCode,
      encryptedToken: student.encryptedPasswordToken || secureTokens.encryptedPasswordToken,
      twoFactorKey: student.twoFactorKey,
      realTimeAuthCode: student.realTimeAuthCode || secureTokens.realTimeAuthCode,
      encryptedPasswordToken: student.encryptedPasswordToken || secureTokens.encryptedPasswordToken,
      twoFactorSetupKey: student.twoFactorSetupKey || secureTokens.twoFactorSetupKey,
      systemTag: student.systemTag || "JRMSU-KCS",
      timestamp: Date.now(),
      systemId: "JRMSU-LIBRARY"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <Admin2FAOverlay
        isOpen={open2FA}
        onClose={() => setOpen2FA(false)}
        userId={student.id}
        userName={student.fullName}
        userEmail={student.email}
        onEnabledChange={(enabled)=>{
          setEditedStudent(prev=>({ ...prev, twoFactorEnabled: enabled }));
          try { ActivityService.log(student.id, enabled ? '2fa_enable' : '2fa_disable'); } catch {}
          try { NotificationsService.add({ receiverId: student.id, type: 'system', message: enabled ? '2FA enabled by admin.' : '2FA disabled by admin.' }); } catch {}
        }}
      />
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="text-2xl font-bold text-primary">
            {isEditing ? "Edit Student Profile" : "Student Profile"}
          </DialogTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile & QR */}
          <div className="lg:col-span-1 space-y-4">
            {/* Profile Picture */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <Avatar className="h-32 w-32 mx-auto border-4 border-primary/20">
                  <AvatarImage src={profileImage || undefined} />
                  <AvatarFallback className="text-2xl bg-green-100 text-green-700">
                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                {isEditing && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Photo
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground">
                      Supported formats: JPG, JPEG, PNG<br />
                      Maximum file size: 5MB
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center" id="student-qr-code">
                  <div className="p-4 bg-white rounded-lg border">
                    <QRCodeSVG
                      value={generateQRData()}
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={handleDownloadQR} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Download QR
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleRegenerateQR}
                    disabled={isRegeneratingQR}
                    className="w-full"
                  >
                    {isRegeneratingQR ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-center text-muted-foreground">
                  Use this QR code for quick library access.
                </p>
              </CardContent>
            </Card>

            {/* Admin 2FA Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" onClick={() => setOpen2FA(true)} className="w-full">Enable 2FA</Button>
                <p className="text-xs text-muted-foreground">Opens Authentication & 2FA overlay for this student</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Student Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IdCard className="h-5 w-5" />
                  Personal Information
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Some fields are read-only for security
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  {isEditing ? (
                    <Input
                      value={editedStudent.fullName}
                      onChange={(e) => setEditedStudent(prev => ({ ...prev, fullName: e.target.value }))}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{student.fullName}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <div className="flex items-center gap-2">
                    <p className="p-2 bg-muted rounded flex-1 text-muted-foreground">{student.id}</p>
                    <Badge variant="outline">Read-only</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedStudent.email}
                      onChange={(e) => setEditedStudent(prev => ({ ...prev, email: e.target.value }))}
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{student.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  {isEditing ? (
                    <Input
                      value={editedStudent.phone || ""}
                      onChange={(e) => setEditedStudent(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="09123456789"
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{student.phone || "Not provided"}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Academic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  {isEditing ? (
                    <Select 
                      value={editedStudent.course || ""} 
                      onValueChange={(value) => setEditedStudent(prev => ({ ...prev, course: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BSCS">Bachelor of Science in Computer Science</SelectItem>
                        <SelectItem value="BSIT">Bachelor of Science in Information Technology</SelectItem>
                        <SelectItem value="BSCpE">Bachelor of Science in Computer Engineering</SelectItem>
                        <SelectItem value="BSIS">Bachelor of Science in Information Systems</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="p-2 bg-muted rounded">{student.course || "Not specified"}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Year Level</Label>
                  {isEditing ? (
                    <Select 
                      value={editedStudent.year || ""} 
                      onValueChange={(value) => setEditedStudent(prev => ({ ...prev, year: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="p-2 bg-muted rounded">{student.year || "Not specified"}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Section</Label>
                  {isEditing ? (
                    <Input
                      value={editedStudent.section || ""}
                      onChange={(e) => setEditedStudent(prev => ({ ...prev, section: e.target.value }))}
                      placeholder="A, B, C, etc."
                    />
                  ) : (
                    <p className="p-2 bg-muted rounded">{student.section || "Not specified"}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>System Tag</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="p-2">{student.systemTag}</Badge>
                    <Badge variant="outline">System Generated</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Permanent Address */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-primary">Permanent Address</Label>
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="permanent_address_street">Street</Label>
                        <Input
                          id="permanent_address_street"
                          name="permanent_address_street"
                          value={editedStudent.permanent_address_street || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, permanent_address_street: e.target.value }))}
                          placeholder="Enter street address"
                          autoComplete="address-line1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permanent_address_barangay">Barangay</Label>
                        <Input
                          id="permanent_address_barangay"
                          name="permanent_address_barangay"
                          value={editedStudent.permanent_address_barangay || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, permanent_address_barangay: e.target.value }))}
                          placeholder="Enter barangay"
                          autoComplete="address-level3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permanent_address_municipality">Municipality/City</Label>
                        <Input
                          id="permanent_address_municipality"
                          name="permanent_address_municipality"
                          value={editedStudent.permanent_address_municipality || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, permanent_address_municipality: e.target.value }))}
                          placeholder="Enter municipality/city"
                          autoComplete="address-level2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permanent_address_province">Province</Label>
                        <Input
                          id="permanent_address_province"
                          name="permanent_address_province"
                          value={editedStudent.permanent_address_province || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, permanent_address_province: e.target.value }))}
                          placeholder="Enter province"
                          autoComplete="address-level1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permanent_address_region">Region</Label>
                        <Input
                          id="permanent_address_region"
                          name="permanent_address_region"
                          value={editedStudent.permanent_address_region || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, permanent_address_region: e.target.value }))}
                          placeholder="Enter region"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="permanent_address_zip">Zip Code</Label>
                        <Input
                          id="permanent_address_zip"
                          name="permanent_address_zip"
                          value={editedStudent.permanent_address_zip || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, permanent_address_zip: e.target.value }))}
                          placeholder="Enter zip code"
                          autoComplete="postal-code"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="p-3 bg-muted rounded min-h-[60px]">
                      {[
                        student.permanent_address_street,
                        student.permanent_address_barangay,
                        student.permanent_address_municipality,
                        student.permanent_address_province,
                        student.permanent_address_region,
                        student.permanent_address_zip
                      ].filter(Boolean).join(', ') || student.address || "Not provided"}
                    </p>
                  )}
                </div>

                {/* Current Address */}
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-primary">Current Address</Label>
                    {isEditing && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="same_as_current"
                          checked={editedStudent.same_as_current || false}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (checked) {
                              setEditedStudent(prev => ({
                                ...prev,
                                same_as_current: true,
                                current_address_street: prev.permanent_address_street,
                                current_address_barangay: prev.permanent_address_barangay,
                                current_address_municipality: prev.permanent_address_municipality,
                                current_address_province: prev.permanent_address_province,
                                current_address_region: prev.permanent_address_region,
                                current_address_zip: prev.permanent_address_zip
                              }));
                            } else {
                              setEditedStudent(prev => ({ ...prev, same_as_current: false }));
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="same_as_current" className="text-sm font-normal cursor-pointer">
                          Same as Permanent Address
                        </Label>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="current_address_street">Street</Label>
                        <Input
                          id="current_address_street"
                          name="current_address_street"
                          value={editedStudent.current_address_street || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, current_address_street: e.target.value }))}
                          placeholder="Enter street address"
                          disabled={editedStudent.same_as_current}
                          className={editedStudent.same_as_current ? 'bg-muted' : ''}
                          autoComplete="address-line1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_address_barangay">Barangay</Label>
                        <Input
                          id="current_address_barangay"
                          name="current_address_barangay"
                          value={editedStudent.current_address_barangay || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, current_address_barangay: e.target.value }))}
                          placeholder="Enter barangay"
                          disabled={editedStudent.same_as_current}
                          className={editedStudent.same_as_current ? 'bg-muted' : ''}
                          autoComplete="address-level3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_address_municipality">Municipality/City</Label>
                        <Input
                          id="current_address_municipality"
                          name="current_address_municipality"
                          value={editedStudent.current_address_municipality || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, current_address_municipality: e.target.value }))}
                          placeholder="Enter municipality/city"
                          disabled={editedStudent.same_as_current}
                          className={editedStudent.same_as_current ? 'bg-muted' : ''}
                          autoComplete="address-level2"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_address_province">Province</Label>
                        <Input
                          id="current_address_province"
                          name="current_address_province"
                          value={editedStudent.current_address_province || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, current_address_province: e.target.value }))}
                          placeholder="Enter province"
                          disabled={editedStudent.same_as_current}
                          className={editedStudent.same_as_current ? 'bg-muted' : ''}
                          autoComplete="address-level1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_address_region">Region</Label>
                        <Input
                          id="current_address_region"
                          name="current_address_region"
                          value={editedStudent.current_address_region || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, current_address_region: e.target.value }))}
                          placeholder="Enter region"
                          disabled={editedStudent.same_as_current}
                          className={editedStudent.same_as_current ? 'bg-muted' : ''}
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="current_address_zip">Zip Code</Label>
                        <Input
                          id="current_address_zip"
                          name="current_address_zip"
                          value={editedStudent.current_address_zip || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, current_address_zip: e.target.value }))}
                          placeholder="Enter zip code"
                          disabled={editedStudent.same_as_current}
                          className={editedStudent.same_as_current ? 'bg-muted' : ''}
                          autoComplete="postal-code"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="current_address_landmark">Landmark/Notes</Label>
                        <Textarea
                          id="current_address_landmark"
                          name="current_address_landmark"
                          value={editedStudent.current_address_landmark || ''}
                          onChange={(e) => setEditedStudent(prev => ({ ...prev, current_address_landmark: e.target.value }))}
                          placeholder="Enter landmark or additional notes"
                          rows={2}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="p-3 bg-muted rounded min-h-[60px]">
                      {[
                        student.current_address_street,
                        student.current_address_barangay,
                        student.current_address_municipality,
                        student.current_address_province,
                        student.current_address_region,
                        student.current_address_zip,
                        student.current_address_landmark
                      ].filter(Boolean).join(', ') || student.address || "Not provided"}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Security - Admin Reset */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Account Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!showPwReset ? (
                  <Button variant="outline" onClick={() => setShowPwReset(true)} className="w-full">Reset Password</Button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <Label>New Password</Label>
                      <Input type={show1 ? 'text' : 'password'} value={pw1} onChange={(e)=>setPw1(e.target.value)} placeholder="Enter new password" />
                      <button type="button" className="absolute right-3 bottom-2 text-muted-foreground" onClick={()=>setShow1(!show1)}>{show1 ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button>
                    </div>
                    <div className="relative">
                      <Label>Confirm Password</Label>
                      <Input type={show2 ? 'text' : 'password'} value={pw2} onChange={(e)=>setPw2(e.target.value)} placeholder="Re-enter new password" />
                      <button type="button" className="absolute right-3 bottom-2 text-muted-foreground" onClick={()=>setShow2(!show2)}>{show2 ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}</button>
                    </div>
                    <Button
                      onClick={()=>{
                        if (pw1.length < 8 || pw1 !== pw2) { toast({ title: 'Check password inputs', variant: 'destructive' }); return; }
                        const res = databaseService.setUserPassword(student.id, pw1);
                        if (res.success) {
                          toast({ title: 'Password changes completed!' });
                          ActivityService.log(student.id, 'password_change');
                          NotificationsService.add({ receiverId: student.id, type: 'system', message: 'Password reset by admin.' });
                          setShowPwReset(false); setPw1(''); setPw2('');
                        } else {
                          toast({ title: 'Reset failed', description: res.error, variant: 'destructive' });
                        }
                      }}
                      className="w-full"
                    >
                      Confirm
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={student.isActive ? "default" : "destructive"}>
                    {student.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">QR Code</p>
                  <Badge variant={student.qrCodeActive ? "default" : "secondary"}>
                    {student.qrCodeActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">2FA</p>
                  <Badge variant={student.twoFactorEnabled ? "default" : "outline"}>
                    {student.twoFactorEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-xs">{new Date(student.createdAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}