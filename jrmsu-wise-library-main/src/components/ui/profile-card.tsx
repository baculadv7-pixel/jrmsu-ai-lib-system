import { useState, useRef } from "react";
import { Camera, QrCode, Shield, Key, Upload, Download, Copy, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User } from "@/types/auth";
import { toast } from "sonner";

interface ProfileCardProps {
  user: User;
  onProfileUpdate: (updates: Partial<User>) => void;
  onProfilePictureUpload: (file: File) => void;
  onToggle2FA: (enabled: boolean) => void;
  onGenerate2FA: () => Promise<{ secret: string; qrCodeUrl: string }>;
}

export function ProfileCard({ 
  user, 
  onProfileUpdate, 
  onProfilePictureUpload, 
  onToggle2FA,
  onGenerate2FA 
}: ProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    email: user.email,
  });
  const [qrCodeData, setQrCodeData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [currentAuthCode, setCurrentAuthCode] = useState("123456"); // Mock code
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userInitials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const userFullName = `${user.firstName} ${user.middleName} ${user.lastName}`;

  const handleSave = () => {
    onProfileUpdate(formData);
    setIsEditing(false);
    toast.success("Profile updated successfully");
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onProfilePictureUpload(file);
      toast.success("Profile picture updated");
    }
  };

  const handleGenerate2FA = async () => {
    try {
      const data = await onGenerate2FA();
      setQrCodeData(data);
    } catch (error) {
      toast.error("Failed to generate 2FA setup");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Generate mock QR code for library user
  const generateLibraryQRCode = () => {
    const userData = {
      id: user.role === "student" ? user.studentId : user.adminId,
      name: userFullName,
      role: user.role,
      email: user.email
    };
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="20" height="20" fill="black"/>
        <rect x="60" y="20" width="20" height="20" fill="black"/>
        <rect x="100" y="20" width="20" height="20" fill="black"/>
        <rect x="140" y="20" width="20" height="20" fill="black"/>
        <rect x="20" y="60" width="20" height="20" fill="black"/>
        <rect x="100" y="60" width="20" height="20" fill="black"/>
        <rect x="20" y="100" width="20" height="20" fill="black"/>
        <rect x="60" y="100" width="20" height="20" fill="black"/>
        <rect x="140" y="100" width="20" height="20" fill="black"/>
        <rect x="60" y="140" width="20" height="20" fill="black"/>
        <rect x="100" y="140" width="20" height="20" fill="black"/>
        <rect x="140" y="140" width="20" height="20" fill="black"/>
        <text x="100" y="190" text-anchor="middle" font-size="12" fill="black">${user.role === "student" ? user.studentId : user.adminId}</text>
      </svg>
    `)}`;
  };

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Profile Information
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            >
              {isEditing ? "Save Changes" : "Edit Profile"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture Section */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.profilePicture} alt={userFullName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
                onClick={handleProfilePictureClick}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">{userFullName}</h3>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary">
                  {user.role === "admin" ? "Administrator" : "Student"}
                </Badge>
                {user.role === "student" && user.studentId && (
                  <Badge variant="outline">ID: {user.studentId}</Badge>
                )}
                {user.role === "admin" && user.adminId && (
                  <Badge variant="outline">ID: {user.adminId}</Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              {isEditing ? (
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{user.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Middle Name</Label>
              {isEditing ? (
                <Input
                  value={formData.middleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{user.middleName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              {isEditing ? (
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{user.lastName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              {isEditing ? (
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              ) : (
                <p className="text-sm p-2 bg-muted rounded">{user.email}</p>
              )}
            </div>
          </div>

          {/* Role-specific Information */}
          {user.role === "student" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <p className="text-sm p-2 bg-muted rounded">{user.department || "Not specified"}</p>
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <p className="text-sm p-2 bg-muted rounded">{user.course || "Not specified"}</p>
              </div>
              <div className="space-y-2">
                <Label>Year Level</Label>
                <p className="text-sm p-2 bg-muted rounded">{user.yearLevel || "Not specified"}</p>
              </div>
              <div className="space-y-2">
                <Label>Block</Label>
                <p className="text-sm p-2 bg-muted rounded">{user.block || "Not specified"}</p>
              </div>
            </div>
          )}

          {user.role === "admin" && user.position && (
            <div className="space-y-2">
              <Label>Position</Label>
              <p className="text-sm p-2 bg-muted rounded">{user.position}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code & 2FA Security Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Security & QR Codes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Library QR Code */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <QrCode className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-medium">Library QR Code</h4>
                <p className="text-sm text-muted-foreground">
                  Your personal QR code for library access
                </p>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">View QR Code</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Your Library QR Code</DialogTitle>
                  <DialogDescription>
                    Use this QR code for quick library access and book borrowing
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center space-y-4">
                  <img
                    src={generateLibraryQRCode()}
                    alt="Library QR Code"
                    className="w-48 h-48 border rounded"
                  />
                  <div className="text-center">
                    <p className="font-medium">{userFullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.role === "student" ? `Student ID: ${user.studentId}` : `Admin ID: ${user.adminId}`}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      // In a real app, this would download the QR code
                      toast.success("QR Code saved to downloads");
                    }}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Separator />

          {/* 2FA Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
              </div>
              <Switch
                checked={user.twoFactorEnabled}
                onCheckedChange={onToggle2FA}
              />
            </div>

            {user.twoFactorEnabled && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                {/* Current Auth Code */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Current Authentication Code</h5>
                    <p className="text-sm text-muted-foreground">Updates every 30 seconds</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-lg font-mono px-4 py-2">
                      {currentAuthCode}
                    </Badge>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(currentAuthCode, "Authentication code")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Setup New Device */}
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">Setup New Device</h5>
                    <p className="text-sm text-muted-foreground">
                      Generate QR code for Google Authenticator
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={handleGenerate2FA}>
                        <Key className="h-4 w-4 mr-2" />
                        Setup 2FA
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Setup Two-Factor Authentication</DialogTitle>
                        <DialogDescription>
                          Scan this QR code with Google Authenticator or similar app
                        </DialogDescription>
                      </DialogHeader>
                      {qrCodeData && (
                        <div className="flex flex-col items-center space-y-4">
                          <img
                            src={qrCodeData.qrCodeUrl}
                            alt="2FA QR Code"
                            className="w-48 h-48 border rounded"
                          />
                          <div className="text-center space-y-2">
                            <p className="text-sm font-medium">Manual Entry Key:</p>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                {qrCodeData.secret}
                              </Badge>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => copyToClipboard(qrCodeData.secret, "2FA secret")}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="w-full space-y-2">
                            <p className="text-xs text-muted-foreground text-center">
                              After scanning, the app will generate codes for your account
                            </p>
                            <Button className="w-full">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              2FA Setup Complete
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}