import { useState, useEffect } from "react";
import { NavigationBar } from "./navigation-bar";
import { ProfileCard } from "@/components/ui/profile-card";
import { User, Notification } from "@/types/auth";
import { toast } from "sonner";

// Mock user data - replace with actual authentication context
const mockAdminUser: User = {
  id: "admin-001",
  firstName: "Juan",
  middleName: "Santos",
  lastName: "Cruz",
  email: "admin@jrmsu.edu.ph",
  role: "admin",
  adminId: "ADM-2024-001",
  position: "Head Librarian",
  twoFactorEnabled: true,
  profilePicture: undefined,
};

const mockStudentUser: User = {
  id: "student-001",
  firstName: "Maria",
  middleName: "Isabel",
  lastName: "Rodriguez",
  email: "maria.rodriguez@jrmsu.edu.ph",
  role: "student",
  studentId: "2024-12345",
  department: "College of Computer Science",
  course: "Bachelor of Science in Information Technology",
  yearLevel: "3rd Year",
  block: "A",
  twoFactorEnabled: false,
  profilePicture: undefined,
};

const mockNotifications: Notification[] = [
  {
    id: "notif-001",
    title: "Book Due Tomorrow",
    message: "Your borrowed book 'React Development Guide' is due tomorrow.",
    type: "warning",
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    read: false,
    userId: "student-001",
  },
  {
    id: "notif-002",
    title: "New Book Available",
    message: "The book you requested 'Advanced TypeScript' is now available for borrowing.",
    type: "success",
    timestamp: new Date(Date.now() - 7200000), // 2 hours ago
    read: false,
    userId: "student-001",
  },
  {
    id: "notif-003",
    title: "System Maintenance",
    message: "Library system will undergo maintenance on Saturday 2PM-4PM.",
    type: "info",
    timestamp: new Date(Date.now() - 86400000), // 1 day ago
    read: true,
    userId: "student-001",
  },
];

// Example component showing complete navigation implementation
export function LayoutExample() {
  // State management - in real app, use proper auth context/store
  const [currentUser, setCurrentUser] = useState<User>(mockStudentUser);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    desktop: true,
    sms: false,
  });
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  // Handlers for navigation bar
  const handleLogout = () => {
    // Clear authentication, redirect to login
    console.log("Logging out...");
    toast.success("Logged out successfully");
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notif => notif.id !== id)
    );
  };

  const handleToggle2FA = (enabled: boolean) => {
    setCurrentUser(prev => ({ ...prev, twoFactorEnabled: enabled }));
    toast.success(`2FA ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleViewAuthCode = () => {
    toast.info("Current 2FA code: 123456 (expires in 25 seconds)");
  };

  const handleNotificationSettingChange = (type: string, enabled: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [type]: enabled }));
    toast.success(`${type} notifications ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    toast.success(`Theme changed to ${newTheme}`);
  };

  // Profile handlers
  const handleProfileUpdate = (updates: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
    toast.success("Profile updated successfully");
  };

  const handleProfilePictureUpload = (file: File) => {
    // In real app, upload to server and get URL
    const mockUrl = URL.createObjectURL(file);
    setCurrentUser(prev => ({ ...prev, profilePicture: mockUrl }));
    toast.success("Profile picture updated");
  };

  const handleGenerate2FA = async (): Promise<{ secret: string; qrCodeUrl: string }> => {
    // Mock 2FA generation - replace with actual implementation
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          secret: "JRMSU2024SECRET123456",
          qrCodeUrl: "data:image/svg+xml;base64," + btoa(`
            <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
              <rect width="200" height="200" fill="white"/>
              <rect x="10" y="10" width="10" height="10" fill="black"/>
              <rect x="30" y="10" width="10" height="10" fill="black"/>
              <rect x="50" y="10" width="10" height="10" fill="black"/>
              <text x="100" y="100" text-anchor="middle" font-size="8" fill="black">2FA QR</text>
            </svg>
          `)
        });
      }, 1000);
    });
  };

  // Switch between admin and student views for demo
  const toggleUserRole = () => {
    setCurrentUser(prev => 
      prev.role === "admin" ? mockStudentUser : mockAdminUser
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar
        user={currentUser}
        notifications={notifications}
        onLogout={handleLogout}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onDismissNotification={handleDismissNotification}
        onToggle2FA={handleToggle2FA}
        onViewAuthCode={handleViewAuthCode}
        notificationSettings={notificationSettings}
        onNotificationSettingChange={handleNotificationSettingChange}
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      {/* Main Content Area */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome, {currentUser.firstName}!
              </h1>
              <p className="text-muted-foreground">
                {currentUser.role === "admin" 
                  ? "Manage your library system with ease" 
                  : "Discover and borrow books for your studies"}
              </p>
            </div>
            <button 
              onClick={toggleUserRole}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Switch to {currentUser.role === "admin" ? "Student" : "Admin"} View
            </button>
          </div>

          {/* Profile Card Example */}
          <ProfileCard
            user={currentUser}
            onProfileUpdate={handleProfileUpdate}
            onProfilePictureUpload={handleProfilePictureUpload}
            onToggle2FA={handleToggle2FA}
            onGenerate2FA={handleGenerate2FA}
          />

          {/* Example content sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentUser.role === "admin" ? (
              <>
                <div className="p-6 bg-card rounded-lg border">
                  <h3 className="text-lg font-semibold mb-2">📊 Dashboard</h3>
                  <p className="text-muted-foreground">View key metrics and system overview</p>
                </div>
                <div className="p-6 bg-card rounded-lg border">
                  <h3 className="text-lg font-semibold mb-2">📚 Book Management</h3>
                  <p className="text-muted-foreground">Manage inventory and QR codes</p>
                </div>
                <div className="p-6 bg-card rounded-lg border">
                  <h3 className="text-lg font-semibold mb-2">👥 Student Management</h3>
                  <p className="text-muted-foreground">Register and manage student accounts</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 bg-card rounded-lg border">
                  <h3 className="text-lg font-semibold mb-2">📖 My Books</h3>
                  <p className="text-muted-foreground">View your borrowed books and due dates</p>
                </div>
                <div className="p-6 bg-card rounded-lg border">
                  <h3 className="text-lg font-semibold mb-2">🔍 Browse Books</h3>
                  <p className="text-muted-foreground">Search and discover available books</p>
                </div>
                <div className="p-6 bg-card rounded-lg border">
                  <h3 className="text-lg font-semibold mb-2">📊 My Statistics</h3>
                  <p className="text-muted-foreground">View your borrowing analytics</p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}