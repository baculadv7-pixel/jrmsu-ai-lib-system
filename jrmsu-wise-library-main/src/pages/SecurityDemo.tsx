import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Camera, Shield, Bell, QrCode } from "lucide-react";
import Navbar from "@/components/Layout/Navbar";
import Sidebar from "@/components/Layout/Sidebar";
import AIAssistant from "@/components/Layout/AIAssistant";
import { NotificationPanel, LibraryNotification } from "@/components/notifications/NotificationPanel";
import { StableQRCode } from "@/components/qr/StableQRCode";
import { QRScanner } from "@/components/qr/QRScanner";
import TwoFASetup from "@/components/auth/TwoFASetup";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

const SecurityDemo = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const userType = user?.role || "student";
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [showScanner, setShowScanner] = useState(false);

  // Mock notifications following database structure
  const [notifications, setNotifications] = useState<LibraryNotification[]>([
    {
      NotificationID: "notif-001",
      UserID: user?.id || "demo-user",
      Title: "Book Due Tomorrow",
      Message: "Your borrowed book 'React Development Guide' is due tomorrow at 5:00 PM.",
      Status: "Unread",
      CreatedAt: new Date(Date.now() - 3600000), // 1 hour ago
      Type: "reminder",
      LinkedAction: "/books/borrowed"
    },
    {
      NotificationID: "notif-002", 
      UserID: user?.id || "demo-user",
      Title: "2FA Enabled Successfully",
      Message: "Two-factor authentication has been activated on your account for enhanced security.",
      Status: "Unread",
      CreatedAt: new Date(Date.now() - 7200000), // 2 hours ago
      Type: "security",
      LinkedAction: "/settings"
    },
    {
      NotificationID: "notif-003",
      UserID: user?.id || "demo-user", 
      Title: "New Book Available",
      Message: "The book you requested 'Advanced TypeScript Programming' is now available for borrowing.",
      Status: "Read",
      CreatedAt: new Date(Date.now() - 86400000), // 1 day ago
      Type: "book",
      LinkedAction: "/books/available"
    },
    {
      NotificationID: "notif-004",
      UserID: user?.id || "demo-user",
      Title: "Profile Updated",
      Message: "Your academic information has been successfully updated.",
      Status: "Read",
      CreatedAt: new Date(Date.now() - 172800000), // 2 days ago
      Type: "user",
      LinkedAction: "/profile"
    },
    {
      NotificationID: "notif-005",
      UserID: user?.id || "demo-user",
      Title: "System Maintenance",
      Message: "Library system will undergo maintenance on Saturday 2PM-4PM. Services may be temporarily unavailable.",
      Status: "Read", 
      CreatedAt: new Date(Date.now() - 259200000), // 3 days ago
      Type: "system",
      LinkedAction: null
    }
  ]);

  // Mock user data for QR code generation
  const userData = {
    firstName: userType === "admin" ? "Jhon Mark" : "Maria Isabel",
    middleName: userType === "admin" ? "Amaca" : "Santos", 
    lastName: userType === "admin" ? "Suico" : "Rodriguez",
    email: userType === "admin" ? "suicojm99@gmail.com" : "maria.rodriguez@jrmsu.edu.ph"
  };

  const handleNotificationClick = (notification: LibraryNotification) => {
    toast({
      title: "Notification clicked",
      description: `Opening: ${notification.Title}`
    });
    
    if (notification.LinkedAction) {
      // Navigate to linked action
      console.log("Navigate to:", notification.LinkedAction);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.NotificationID === notificationId
          ? { ...notif, Status: "Read" as const }
          : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, Status: "Read" as const }))
    );
  };

  const handleDismissNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.NotificationID !== notificationId)
    );
  };

  const handleScanSuccess = (scanData: any) => {
    toast({
      title: "QR Scan Successful",
      description: `Scanned: ${scanData.fullName || scanData.title || "Unknown"}`
    });
    console.log("Scanned data:", scanData);
  };

  const handleScanError = (error: string) => {
    toast({
      title: "Scan Error",
      description: error,
      variant: "destructive"
    });
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
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">Security & QR System Demo</h1>
                <p className="text-muted-foreground mt-1">
                  Complete demonstration of QR codes, 2FA authentication, and notification system
                </p>
              </div>
              <div className="flex items-center gap-2">
                <NotificationPanel
                  notifications={notifications}
                  onNotificationClick={handleNotificationClick}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onDismiss={handleDismissNotification}
                />
                <Button onClick={() => setShowScanner(true)}>
                  <Camera className="h-4 w-4 mr-2" />
                  Open Scanner
                </Button>
              </div>
            </div>

            <Tabs defaultValue="qr-codes" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="qr-codes">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Codes
                </TabsTrigger>
                <TabsTrigger value="scanner">
                  <Camera className="h-4 w-4 mr-2" />
                  Scanner
                </TabsTrigger>
                <TabsTrigger value="2fa">
                  <Shield className="h-4 w-4 mr-2" />
                  2FA Setup
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </TabsTrigger>
              </TabsList>

              {/* QR Codes Tab */}
              <TabsContent value="qr-codes" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Stable User QR Code</h2>
                    <StableQRCode
                      userId={user?.id || "demo-user"}
                      userType={userType}
                      userData={userData}
                      twoFactorKey={user?.twoFactorEnabled ? "DEMO2FAKEY123456" : undefined}
                      allowRegeneration={true}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">QR Code Features</h2>
                    <Card>
                      <CardHeader>
                        <CardTitle>Database Structure</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-sm space-y-2">
                          <p><strong>QR Code Fields:</strong></p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Full Name: {userData.firstName} {userData.middleName} {userData.lastName}</li>
                            <li>User ID: {user?.id || "demo-user"}</li>
                            <li>Real-time Auth Code: Updates every 30s</li>
                            <li>Encrypted Password Token: Hidden from UI</li>
                            <li>2FA Setup Key: {user?.twoFactorEnabled ? "Linked to Google Authenticator" : "Not configured"}</li>
                            <li>System ID: JRMSU-LIBRARY</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Stability Rules</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-2">
                          <p><strong>QR Code regenerates only when:</strong></p>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>User updates profile information</li>
                            <li>Admin manually triggers regeneration</li>
                            <li>2FA setup is changed</li>
                          </ul>
                          <Separator className="my-2" />
                          <p className="text-muted-foreground">
                            The QR code remains stable across sessions and page refreshes, 
                            stored securely in the database.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Scanner Tab */}
              <TabsContent value="scanner" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>QR Code Scanner</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Click the button below to activate the QR scanner. The scanner will:
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li>Auto-detect available camera devices</li>
                        <li>Show camera selection dropdown (if multiple cameras)</li>
                        <li>Display live camera preview</li>
                        <li>Validate JRMSU Library System QR codes only</li>
                        <li>Reject generic or unrelated QR codes</li>
                      </ul>
                      
                      <Button 
                        onClick={() => setShowScanner(true)}
                        className="w-full"
                        size="lg"
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Activate QR Scanner
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Validation Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <Badge variant="outline" className="mb-2">Book QR Codes</Badge>
                          <p className="text-sm text-muted-foreground mb-2">Must contain:</p>
                          <ul className="list-disc pl-6 text-xs space-y-1">
                            <li>Book Code</li>
                            <li>Title</li>
                            <li>Author</li>
                            <li>Category</li>
                            <li>ISBN</li>
                          </ul>
                        </div>

                        <Separator />

                        <div>
                          <Badge variant="outline" className="mb-2">User QR Codes</Badge>
                          <p className="text-sm text-muted-foreground mb-2">Must contain:</p>
                          <ul className="list-disc pl-6 text-xs space-y-1">
                            <li>Full Name</li>
                            <li>User ID (Admin/Student)</li>
                            <li>Real-Time Authentication Code</li>
                            <li>Encrypted Password Token</li>
                            <li>2FA Setup Key</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* 2FA Tab */}
              <TabsContent value="2fa" className="space-y-6">
                <TwoFASetup />
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification System Demo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">
                        Click the notification bell in the top navigation to see the full notification panel.
                        The system includes:
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-sm">
                        <li><strong>All Notifications</strong> - Shows every notification</li>
                        <li><strong>Unread Tab</strong> - Shows only unread with count</li>
                        <li><strong>Auto Mark Read</strong> - Clicking marks as read</li>
                        <li><strong>Mark All Read</strong> - Bulk action button</li>
                        <li><strong>Real-time Updates</strong> - Live notification count</li>
                      </ul>
                      
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">Current Notifications:</p>
                        <div className="space-y-2">
                          {notifications.slice(0, 3).map(notif => (
                            <div key={notif.NotificationID} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                              <span className="truncate flex-1">{notif.Title}</span>
                              <Badge variant={notif.Status === "Unread" ? "default" : "secondary"} className="text-xs">
                                {notif.Status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Database Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-3">
                        <p><strong>Notification Table Fields:</strong></p>
                        <div className="bg-muted p-3 rounded font-mono text-xs">
                          NotificationID | UserID | Title | Message |<br />
                          Status (Read/Unread) | CreatedAt | Type |<br />
                          LinkedAction
                        </div>
                        
                        <div className="space-y-2">
                          <p><strong>Types:</strong></p>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">system</Badge>
                            <Badge variant="outline">book</Badge>
                            <Badge variant="outline">user</Badge>
                            <Badge variant="outline">security</Badge>
                            <Badge variant="outline">reminder</Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p><strong>Email Integration:</strong></p>
                          <p className="text-muted-foreground text-xs">
                            Email addresses are displayed in Profile → Contact Information
                            and can be edited by admins or viewed (read-only) by students.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* QR Scanner Dialog */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />

      <AIAssistant />
    </div>
  );
};

export default SecurityDemo;