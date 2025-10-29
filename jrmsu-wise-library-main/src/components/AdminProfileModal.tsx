import { useState, useRef, useEffect, useCallback } from "react";
import { X, Upload, Download, RotateCcw, Save, AlertCircle, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { databaseService, User } from "@/services/database";
import { qrCodeService } from "@/services/qrcode";
import Admin2FAOverlay from "@/components/settings/Admin2FAOverlay";
import { pythonApi } from "@/services/pythonApi";
import { ActivityService } from "@/services/activity";
import { NotificationsService } from "@/services/notifications";

interface AdminProfileModalProps {
  admin: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAdmin: User) => void;
}

export const AdminProfileModal: React.FC<AdminProfileModalProps> = ({
  admin,
  isOpen,
  onClose,
  onSave
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<User>(admin);
  const [profileImage, setProfileImage] = useState<string>(admin.profilePicture || '');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [open2FA, setOpen2FA] = useState(false);
  
  // Password reset state
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

const generateQRCode = useCallback(async () => {
    try {
      setIsGeneratingQR(true);
      
      // Generate secure tokens if they don't exist
      const secureTokens = qrCodeService.generateSecureTokens();
      
      // Use type assertion to access extended properties
      const extendedFormData = formData as any;
      
      const qrData = {
        fullName: formData.fullName || `${formData.firstName} ${formData.lastName}`,
        userId: formData.id,
        userType: formData.userType as "admin" | "student",
        department: formData.department,
        role: formData.role,
        authCode: extendedFormData.realTimeAuthCode || secureTokens.realTimeAuthCode,
        encryptedToken: extendedFormData.encryptedPasswordToken || secureTokens.encryptedPasswordToken,
        twoFactorKey: formData.twoFactorKey,
        realTimeAuthCode: extendedFormData.realTimeAuthCode || secureTokens.realTimeAuthCode,
        encryptedPasswordToken: extendedFormData.encryptedPasswordToken || secureTokens.encryptedPasswordToken,
        twoFactorSetupKey: extendedFormData.twoFactorSetupKey || secureTokens.twoFactorSetupKey,
        systemTag: formData.systemTag || "JRMSU-KCL",
        timestamp: Date.now(),
        systemId: "JRMSU-LIBRARY"
      };
      
      const qrDataUrl = await qrCodeService.generateQRCode(qrData);
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "QR Code Error",
        description: "Failed to generate QR code for admin profile.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQR(false);
    }
}, [formData, toast]);

// Generate QR code on modal open (after callback is defined)
useEffect(() => {
  if (isOpen && admin) {
    generateQRCode();
  }
}, [isOpen, admin, generateQRCode]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or GIF image.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Create FileReader to convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setProfileImage(result);
      setFormData(prev => ({ ...prev, profilePicture: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) {
      toast({
        title: "No QR Code",
        description: "QR code is not available for download.",
        variant: "destructive"
      });
      return;
    }

    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${formData.fullName.replace(/\s+/g, '_')}_Admin_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "QR Code Downloaded",
      description: "Admin QR code has been downloaded successfully.",
    });
  };

  const handleRegenerateQR = async () => {
    await generateQRCode();
    toast({
      title: "QR Code Regenerated",
      description: "A new QR code has been generated for this admin.",
    });
  };

  const handleInputChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!formData.firstName?.trim() || !formData.lastName?.trim()) {
        toast({ title: "Validation Error", description: "First name and last name are required.", variant: "destructive" });
        return;
      }
      if (!formData.email?.trim()) {
        toast({ title: "Validation Error", description: "Email address is required.", variant: "destructive" });
        return;
      }
      if (!formData.role && !(formData as any).position) {
        toast({ title: "Validation Error", description: "Position / Role is required.", variant: "destructive" });
        return;
      }

      // Normalize position/role and name
      const position = (formData as any).position || formData.role;
      const updatedAdmin = {
        ...formData,
        role: position as any,
        // keep a separate 'position' field for clarity
        ...(position ? { position } : {}),
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        updatedAt: new Date()
      } as User;

      // Update in local database and backend
      const result = databaseService.updateUser(updatedAdmin.id, updatedAdmin);
      try { await pythonApi.updateUser(updatedAdmin.id, { ...updatedAdmin }); } catch {}
      
      if (result.success) {
        onSave(updatedAdmin);
        toast({ title: "Admin Updated", description: "Administrator profile has been successfully updated." });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      toast({ title: "Update Failed", description: "Failed to update administrator profile.", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    // Reset form data to original admin data
    setFormData(admin);
    setProfileImage(admin.profilePicture || '');
    setShowPasswordReset(false);
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  const handlePasswordReset = async () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Both password fields are required.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 8 characters long.",
        variant: "destructive"
      });
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpperCase || !hasNumber) {
      toast({
        title: "Weak Password",
        description: "Password must contain at least one uppercase letter and one number.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsResettingPassword(true);

      // Call backend API to reset password
      const response = await pythonApi.resetUserPassword({
        userId: formData.id,
        userType: formData.userType,
        newPassword
      });

      if (response.success) {
        // Log activity
        try {
          ActivityService.log(formData.id, 'password_change', `Admin password reset for ${formData.fullName}`);
        } catch (e) {
          console.warn('Failed to log activity:', e);
        }

        // Notify admin (simple notification)
        try {
          NotificationsService.add({
            receiverId: formData.id,
            type: 'system',
            message: `Your password has been reset successfully.`,
            metadata: { action: 'password_reset' }
          });
        } catch (e) {
          console.warn('Failed to send notification:', e);
        }

        toast({
          title: "Password Reset",
          description: "Admin password has been reset successfully.",
        });

        // Clear form and close password reset
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordReset(false);
      } else {
        toast({
          title: "Reset Failed",
          description: response.message || "Failed to reset password.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-primary">Admin Profile</h2>
            <p className="text-muted-foreground">Edit administrator information and settings</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <Admin2FAOverlay
            isOpen={open2FA}
            onClose={() => setOpen2FA(false)}
            userId={formData.id}
            userName={formData.fullName}
            userEmail={formData.email}
            onEnabledChange={(enabled)=>{
              setFormData(prev=>({ ...prev, twoFactorEnabled: enabled }));
              try { ActivityService.log(formData.id, enabled ? '2fa_enable' : '2fa_disable'); } catch {}
              try { NotificationsService.add({ receiverId: formData.id, type: 'system', message: enabled ? '2FA enabled by admin.' : '2FA disabled by admin.' }); } catch {}
            }}
          />
          {/* Profile Picture and QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profile Picture Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Profile Picture</Label>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20 border-2 border-blue-200">
                  <AvatarImage src={profileImage} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                    {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload New
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG, GIF up to 5MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">QR Code</Label>
              <div className="border rounded-lg p-4 bg-gray-50 text-center">
                {isGeneratingQR ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : qrCodeDataUrl ? (
                  <div className="space-y-3">
                    <img
                      src={qrCodeDataUrl}
                      alt="Admin QR Code"
                      className="mx-auto h-32 w-32 object-contain"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" variant="outline" onClick={handleDownloadQR} className="gap-1">
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleRegenerateQR} className="gap-1">
                        <RotateCcw className="h-3 w-3" />
                        Regenerate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 flex items-center justify-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8" />
                    <span className="ml-2">QR Code unavailable</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Personal Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName || ''}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName || ''}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminId">Admin ID</Label>
                <Input
                  id="adminId"
                  value={formData.id || ''}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Administrative Details */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Administrative Details</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position / Role *</Label>
                <Select
                  value={(formData as any).position || formData.role || ''}
                  onValueChange={(value) => { handleInputChange('role', value as any); setFormData(prev=>({ ...prev, position: value as any })); }}
                >
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Select Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="systemTag">System Tag</Label>
                <Input
                  id="systemTag"
                  value={formData.systemTag || ''}
                  onChange={(e) => handleInputChange('systemTag', e.target.value)}
                  placeholder="JRMSU-KCL"
                />
              </div>
          </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Address Information</Label>
            
            {/* Permanent Address */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-primary">Permanent Address</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street || ''}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    placeholder="Enter street address"
                    autoComplete="address-line1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barangay">Barangay</Label>
                  <Input
                    id="barangay"
                    name="barangay"
                    value={formData.barangay || ''}
                    onChange={(e) => handleInputChange('barangay', e.target.value)}
                    placeholder="Enter barangay"
                    autoComplete="address-level3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="municipality">Municipality/City</Label>
                  <Input
                    id="municipality"
                    name="municipality"
                    value={formData.municipality || ''}
                    onChange={(e) => handleInputChange('municipality', e.target.value)}
                    placeholder="Enter municipality/city"
                    autoComplete="address-level2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Input
                    id="province"
                    name="province"
                    value={formData.province || ''}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    placeholder="Enter province"
                    autoComplete="address-level1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    name="region"
                    value={formData.region || ''}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    placeholder="Enter region"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">Zip Code</Label>
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code || ''}
                    onChange={(e) => handleInputChange('zip_code', e.target.value)}
                    placeholder="Enter zip code"
                    autoComplete="postal-code"
                  />
                </div>
              </div>
            </div>

            {/* Current Address */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-primary">Current Address</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="same_as_current"
                    checked={formData.same_as_current || false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      if (checked) {
                        setFormData(prev => ({
                          ...prev,
                          same_as_current: true,
                          current_street: prev.street,
                          current_barangay: prev.barangay,
                          current_municipality: prev.municipality,
                          current_province: prev.province,
                          current_region: prev.region,
                          current_zip: prev.zip_code
                        }));
                      } else {
                        handleInputChange('same_as_current', false);
                      }
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="same_as_current" className="text-sm font-normal cursor-pointer">
                    Same as Permanent Address
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="current_street">Street</Label>
                  <Input
                    id="current_street"
                    name="current_street"
                    value={formData.current_street || ''}
                    onChange={(e) => handleInputChange('current_street', e.target.value)}
                    placeholder="Enter street address"
                    disabled={formData.same_as_current}
                    className={formData.same_as_current ? 'bg-muted' : ''}
                    autoComplete="address-line1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_barangay">Barangay</Label>
                  <Input
                    id="current_barangay"
                    name="current_barangay"
                    value={formData.current_barangay || ''}
                    onChange={(e) => handleInputChange('current_barangay', e.target.value)}
                    placeholder="Enter barangay"
                    disabled={formData.same_as_current}
                    className={formData.same_as_current ? 'bg-muted' : ''}
                    autoComplete="address-level3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_municipality">Municipality/City</Label>
                  <Input
                    id="current_municipality"
                    name="current_municipality"
                    value={formData.current_municipality || ''}
                    onChange={(e) => handleInputChange('current_municipality', e.target.value)}
                    placeholder="Enter municipality/city"
                    disabled={formData.same_as_current}
                    className={formData.same_as_current ? 'bg-muted' : ''}
                    autoComplete="address-level2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_province">Province</Label>
                  <Input
                    id="current_province"
                    name="current_province"
                    value={formData.current_province || ''}
                    onChange={(e) => handleInputChange('current_province', e.target.value)}
                    placeholder="Enter province"
                    disabled={formData.same_as_current}
                    className={formData.same_as_current ? 'bg-muted' : ''}
                    autoComplete="address-level1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_region">Region</Label>
                  <Input
                    id="current_region"
                    name="current_region"
                    value={formData.current_region || ''}
                    onChange={(e) => handleInputChange('current_region', e.target.value)}
                    placeholder="Enter region"
                    disabled={formData.same_as_current}
                    className={formData.same_as_current ? 'bg-muted' : ''}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_zip">Zip Code</Label>
                  <Input
                    id="current_zip"
                    name="current_zip"
                    value={formData.current_zip || ''}
                    onChange={(e) => handleInputChange('current_zip', e.target.value)}
                    placeholder="Enter zip code"
                    disabled={formData.same_as_current}
                    className={formData.same_as_current ? 'bg-muted' : ''}
                    autoComplete="postal-code"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="current_landmark">Landmark/Notes</Label>
                  <Textarea
                    id="current_landmark"
                    name="current_landmark"
                    value={formData.current_landmark || ''}
                    onChange={(e) => handleInputChange('current_landmark', e.target.value)}
                    placeholder="Enter landmark or additional notes"
                    rows={2}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Security Settings</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Enable Two-Factor Authentication</Label>
                <Button variant="outline" onClick={() => setOpen2FA(true)}>Enable 2FA</Button>
                <p className="text-xs text-muted-foreground">Syncs globally to Authentication & 2FA page</p>
              </div>
              <div className="space-y-2">
                <Label>Account Active</Label>
                <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Toggle account availability</span>
                  <Switch checked={!!formData.isActive} onCheckedChange={(val)=> setFormData(prev=>({ ...prev, isActive: Boolean(val) }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Account Security - Password Reset */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Account Security</Label>
            </div>
            
            {!showPasswordReset ? (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowPasswordReset(true)}
              >
                Reset Password
              </Button>
            ) : (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with 1 uppercase and 1 number
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowPasswordReset(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handlePasswordReset}
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? "Resetting..." : "Confirm"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Account Information */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Account Information</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Created Date</Label>
                <Input
                  value={new Date(formData.createdAt).toLocaleDateString()}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <Input
                  value={formData.updatedAt ? new Date(formData.updatedAt).toLocaleDateString() : 'Never'}
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileModal;