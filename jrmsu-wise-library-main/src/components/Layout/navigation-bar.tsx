import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/ui/notification-bell";
import { SettingsMenu } from "@/components/ui/settings-menu";
import { AIAssistant } from "@/components/ui/ai-assistant";
import { getNavigationForRole } from "@/config/navigation";
import { User, UserRole, Notification } from "@/types/auth";
import { LogOut } from "lucide-react";

interface NavigationBarProps {
  user: User | null;
  notifications: Notification[];
  onLogout: () => void;
  onMarkNotificationAsRead: (id: string) => void;
  onMarkAllNotificationsAsRead: () => void;
  onDismissNotification: (id: string) => void;
  onToggle2FA: (enabled: boolean) => void;
  onViewAuthCode: () => void;
  notificationSettings: {
    email: boolean;
    desktop: boolean;
    sms: boolean;
  };
  onNotificationSettingChange: (type: string, enabled: boolean) => void;
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

export function NavigationBar({ 
  user, 
  notifications,
  onLogout,
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead,
  onDismissNotification,
  onToggle2FA,
  onViewAuthCode,
  notificationSettings,
  onNotificationSettingChange,
  theme,
  onThemeChange
}: NavigationBarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const navigation = getNavigationForRole(user.role);
  const userInitials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  const userFullName = `${user.firstName} ${user.middleName} ${user.lastName}`;

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Link to={user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">JW</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">JRMSU WISE</span>
                  <span className="text-xs text-muted-foreground">Library System</span>
                </div>
              </Link>
            </div>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigation.main.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant={active ? "default" : "ghost"}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden lg:block">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* Right Side Controls */}
            <div className="flex items-center space-x-2">
              {/* Notification Bell */}
              <NotificationBell
                notifications={notifications}
                onMarkAsRead={onMarkNotificationAsRead}
                onMarkAllAsRead={onMarkAllNotificationsAsRead}
                onDismiss={onDismissNotification}
              />

              {/* Settings Menu */}
              <SettingsMenu
                userRole={user.role}
                twoFactorEnabled={user.twoFactorEnabled}
                onToggle2FA={onToggle2FA}
                onViewAuthCode={onViewAuthCode}
                notifications={notificationSettings}
                onNotificationChange={onNotificationSettingChange}
                theme={theme}
                onThemeChange={onThemeChange}
              />

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.profilePicture} alt={userFullName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userFullName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                      <Badge variant="secondary" className="w-fit text-xs mt-1">
                        {user.role === "admin" ? "Administrator" : "Student"}
                        {user.role === "student" && user.studentId && ` • ${user.studentId}`}
                        {user.role === "admin" && user.adminId && ` • ${user.adminId}`}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate(navigation.profile.href)}>
                    <navigation.profile.icon className="mr-2 h-4 w-4" />
                    <span>{navigation.profile.title}</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={onLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Navigation - Hidden by default, can be toggled */}
          <div className="md:hidden border-t py-2">
            <div className="flex flex-wrap gap-1">
              {navigation.main.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} to={item.href} className="flex-1 min-w-0">
                    <Button
                      variant={active ? "default" : "ghost"}
                      size="sm"
                      className="w-full justify-start truncate"
                    >
                      <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* AI Assistant - Floating */}
      <AIAssistant userRole={user.role} currentPage={location.pathname} />
    </>
  );
}