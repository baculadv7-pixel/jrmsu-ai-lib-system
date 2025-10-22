import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Shield, RotateCcw } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import QRCodeDisplay, { downloadCanvasAsPng } from "@/components/qr/QRCodeDisplay";
import { useEffect, useRef, useState } from "react";
import { generateUserQR } from "@/services/qr";
import { useAuth } from "@/context/AuthContext";

const Profile = () => {
  const { user } = useAuth();
  const userType = user?.role || "student";
  const [qrEnvelope, setQrEnvelope] = useState<string>("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
            department: user.department || user.course,
            course: user.course,
            year: user.year,
            role: user.role === 'admin' ? 'Administrator' : 'Student',
            email: user.email,
            encryptedPasswordToken: btoa(`${user.id}-${Date.now()}`),
            systemTag: user.role === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS',
            timestamp: Date.now(),
            systemId: 'JRMSU-LIBRARY'
          });
          setQrEnvelope(fallbackQRData);
        }
      })();
    }
  }, [user?.id]);

  // Mock user data based on role - replace with actual API call
  const getUserData = () => {
    if (userType === "admin") {
      return {
        firstName: "Jhon Mark",
        middleName: "Amaca",
        surname: "Suico",
        suffix: "",
        gender: "Male",
        birthday: "02/20/2004",
        age: 21,
        id: user?.id || "KCL-00001",
        position: "Librarian",
        street: "Purok 3",
        barangay: "Barangay Dos",
        municipality: "Katipunan",
        province: "Zamboanga Del Norte",
        country: "Philippines",
        zipCode: "7109",
        contact: "09468861751",
        email: "suicojm99@gmail.com",
      };
    } else {
      return {
        firstName: "Maria Isabel",
        middleName: "Santos",
        surname: "Rodriguez",
        suffix: "",
        gender: "Female",
        birthday: "05/15/2002",
        age: 22,
        id: user?.id || "2024-12345",
        department: "College of Computer Science",
        course: "Bachelor of Science in Information Technology",
        yearLevel: "3rd Year",
        block: "A",
        street: "123 Main Street",
        barangay: "Barangay Central",
        municipality: "Dipolog City",
        province: "Zamboanga Del Norte",
        country: "Philippines",
        zipCode: "7100",
        contact: "09123456789",
        email: "maria.rodriguez@jrmsu.edu.ph",
      };
    }
  };

  const userData = getUserData();

  return (
    <div className="min-h-screen bg-background">
      <Navbar userType={userType} />
      
      <div className="flex">
        <Sidebar userType={userType} />
        
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">Profile</h1>
              <p className="text-muted-foreground mt-1">
                View and manage your account information
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
                      <div role="img">
                        {/* capture canvas ref for download */}
                        <QRCodeDisplay data={qrEnvelope || "{}"} size={192} centerLabel={userType === "admin" ? "JRMSU–KCL" : "JRMSU–KCS"} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const wrap = (e: Element | null): HTMLCanvasElement | null => {
                          if (!e) return null;
                          const c = e.querySelector("canvas");
                          return c as HTMLCanvasElement | null;
                        };
                        const container = document.querySelector("main .h-48.w-48");
                        const canvas = wrap(container);
                        if (canvas) {
                          downloadCanvasAsPng(canvas, "user-qr.png");
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
                          } catch (error) {
                            console.error('Failed to regenerate QR code:', error);
                            // Fallback: Generate new QR manually (no 2FA/real-time codes)
                            const fallbackQRData = JSON.stringify({
                              fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                              userId: user.id,
                              userType: user.role,
                              department: user.department || user.course,
                              course: user.course,
                              year: user.year,
                              role: user.role === 'admin' ? 'Administrator' : 'Student',
                              email: user.email,
                              encryptedPasswordToken: btoa(`${user.id}-${Date.now()}`),
                              systemTag: user.role === 'admin' ? 'JRMSU-KCL' : 'JRMSU-KCS',
                              timestamp: Date.now(),
                              systemId: 'JRMSU-LIBRARY'
                            });
                            setQrEnvelope(fallbackQRData);
                          }
                        }
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Regenerate QR
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Use this QR code for quick library access
                  </p>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card className="lg:col-span-2 shadow-jrmsu">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                      <p className="font-medium">
                        {userData.firstName} {userData.middleName} {userData.surname}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {userType === "admin" ? "Admin ID" : "Student ID"}
                      </p>
                      <p className="font-medium">{userData.id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gender</p>
                      <p className="font-medium">{userData.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Age</p>
                      <p className="font-medium">{userData.age}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Birthday</p>
                      <p className="font-medium">{userData.birthday}</p>
                    </div>
                    {userType === "admin" ? (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Position</p>
                        <p className="font-medium">{(userData as any).position}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Year Level</p>
                        <p className="font-medium">{(userData as any).yearLevel}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student-specific Information */}
            {userType === "student" && (
              <Card className="shadow-jrmsu">
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Department</p>
                      <p className="font-medium">{(userData as any).department}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Course</p>
                      <p className="font-medium">{(userData as any).course}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Year Level</p>
                      <p className="font-medium">{(userData as any).yearLevel}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Block</p>
                      <p className="font-medium">{(userData as any).block}</p>
                    </div>
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
                    <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                    <p className="font-medium">{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact Number</p>
                    <p className="font-medium">{userData.contact}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="shadow-jrmsu">
              <CardHeader>
                <CardTitle>Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Current Address</p>
                  <p className="font-medium">
                    {userData.street}, {userData.barangay}, {userData.municipality},{" "}
                    {userData.province}, {userData.country} {userData.zipCode}
                  </p>
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
                  <Badge variant="secondary">Disabled</Badge>
                </div>
                <Button variant="outline">
                  Enable 2FA
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

export default Profile;
