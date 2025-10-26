import { useState, useRef, useEffect } from "react";
import { X, Upload, Download, RotateCcw, Save, AlertCircle } from "lucide-react";
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

  // Generate QR code on modal open
  useEffect(() => {
    if (isOpen && admin) {
      generateQRCode();
    }
  }, [isOpen, admin, generateQRCode]);

  const generateQRCode = React.useCallback(async () => {
    try {
      setIsGeneratingQR(true);
      
      // Generate secure tokens if they don't exist
      const secureTokens = qrCodeService.generateSecureTokens();
      
      const qrData = {
        fullName: formData.fullName || `${formData.firstName} ${formData.lastName}`,
        userId: formData.id,
        userType: formData.userType as "admin" | "student",
        department: formData.department,
        role: formData.role,
        authCode: formData.realTimeAuthCode || secureTokens.realTimeAuthCode,
        encryptedToken: formData.encryptedPasswordToken || secureTokens.encryptedPasswordToken,
        twoFactorKey: formData.twoFactorKey,
        realTimeAuthCode: formData.realTimeAuthCode || secureTokens.realTimeAuthCode,
        encryptedPasswordToken: formData.encryptedPasswordToken || secureTokens.encryptedPasswordToken,
        twoFactorSetupKey: formData.twoFactorSetupKey || secureTokens.twoFactorSetupKey,
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
        toast({
          title: "Validation Error",
          description: "First name and last name are required.",
          variant: "destructive"
        });
        return;
      }

      if (!formData.email?.trim()) {
        toast({
          title: "Validation Error",
          description: "Email address is required.",
          variant: "destructive"
        });
        return;
      }

      // Update fullName based on first and last name
      const updatedAdmin = {
        ...formData,
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        updatedAt: new Date().toISOString()
      };

      // Update in database
      const result = databaseService.updateUser(updatedAdmin.id, updatedAdmin);
      
      if (result.success) {
        onSave(updatedAdmin);
        toast({
          title: "Admin Updated",
          description: "Administrator profile has been successfully updated.",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update administrator profile.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    // Reset form data to original admin data
    setFormData(admin);
    setProfileImage(admin.profilePicture || '');
    onClose();
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
                <Label htmlFor="department">Department</Label>
                <Select
                  value={formData.department || ''}
                  onValueChange={(value) => handleInputChange('department', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Library Services">Library Services</SelectItem>
                    <SelectItem value="IT Department">IT Department</SelectItem>
                    <SelectItem value="Academic Affairs">Academic Affairs</SelectItem>
                    <SelectItem value="Student Affairs">Student Affairs</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Human Resources">Human Resources</SelectItem>
                    <SelectItem value="Facilities Management">Facilities Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role || ''}
                  onValueChange={(value) => handleInputChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="System Administrator">System Administrator</SelectItem>
                    <SelectItem value="Library Manager">Library Manager</SelectItem>
                    <SelectItem value="IT Specialist">IT Specialist</SelectItem>
                    <SelectItem value="Academic Coordinator">Academic Coordinator</SelectItem>
                    <SelectItem value="Student Services Coordinator">Student Services Coordinator</SelectItem>
                    <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                    <SelectItem value="HR Specialist">HR Specialist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Security Settings</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="systemTag">System Tag</Label>
                <Input
                  id="systemTag"
                  value={formData.systemTag || ''}
                  onChange={(e) => handleInputChange('systemTag', e.target.value)}
                  placeholder="Enter system tag"
                />
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  id="twoFactorEnabled"
                  checked={formData.twoFactorEnabled || false}
                  onCheckedChange={(checked) => handleInputChange('twoFactorEnabled', checked)}
                />
                <Label htmlFor="twoFactorEnabled">Enable Two-Factor Authentication</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  id="qrCodeActive"
                  checked={formData.qrCodeActive || false}
                  onCheckedChange={(checked) => handleInputChange('qrCodeActive', checked)}
                />
                <Label htmlFor="qrCodeActive">Enable QR Code Login</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Switch
                  id="isActive"
                  checked={formData.isActive ?? true}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Account Active</Label>
              </div>
            </div>
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