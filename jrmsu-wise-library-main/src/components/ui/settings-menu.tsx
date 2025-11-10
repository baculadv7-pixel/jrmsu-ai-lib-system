import { useState } from "react";
import { 
  Settings, 
  Shield, 
  Bell, 
  Key, 
  User, 
  Lock,
  Smartphone,
  Mail,
  Monitor,
  Moon,
  Sun,
  Database,
  Activity,
  Eye,
  Timer,
  Volume2,
  VolumeX,
  Grid,
  List,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/auth";

interface SettingsMenuProps {
  userRole: UserRole;
  twoFactorEnabled: boolean;
  onToggle2FA: (enabled: boolean) => void;
  onViewAuthCode: () => void;
  notifications: {
    email: boolean;
    desktop: boolean;
    sms: boolean;
  };
  onNotificationChange: (type: string, enabled: boolean) => void;
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

export function SettingsMenu({
  userRole,
  twoFactorEnabled,
  onToggle2FA,
  onViewAuthCode,
  notifications,
  onNotificationChange,
  theme,
  onThemeChange
}: SettingsMenuProps) {
  const [open, setOpen] = useState(false);

  const isAdmin = userRole === "admin";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Authentication & 2FA Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Shield className="mr-2 h-4 w-4" />
            <span>Authentication & 2FA</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Smartphone className="mr-2 h-4 w-4" />
                <span className="text-sm">Two-Factor Auth</span>
              </div>
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={onToggle2FA}
              />
            </DropdownMenuItem>
            {twoFactorEnabled && (
              <DropdownMenuItem onClick={onViewAuthCode}>
                <Key className="mr-2 h-4 w-4" />
                <span>View Auth Code</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Live
                </Badge>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <Lock className="mr-2 h-4 w-4" />
              <span>Change Password</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Activity className="mr-2 h-4 w-4" />
              <span>Session History</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Notification Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notification Settings</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                <span className="text-sm">Email Notifications</span>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={(checked) => onNotificationChange('email', checked)}
              />
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Monitor className="mr-2 h-4 w-4" />
                <span className="text-sm">Desktop Notifications</span>
              </div>
              <Switch
                checked={notifications.desktop}
                onCheckedChange={(checked) => onNotificationChange('desktop', checked)}
              />
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Smartphone className="mr-2 h-4 w-4" />
                <span className="text-sm">SMS Reminders</span>
              </div>
              <Switch
                checked={notifications.sms}
                onCheckedChange={(checked) => onNotificationChange('sms', checked)}
              />
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Account Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <User className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              <span>Manage Email</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Smartphone className="mr-2 h-4 w-4" />
              <span>Manage Phone</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Key className="mr-2 h-4 w-4" />
              <span>Recovery Options</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Timer className="mr-2 h-4 w-4" />
              <span>Auto-Logout Timer</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Library Preferences */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Eye className="mr-2 h-4 w-4" />
            <span>Library Preferences</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>Book View</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => {}}>
              <Grid className="mr-2 h-4 w-4" />
              <span>Grid View</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}>
              <List className="mr-2 h-4 w-4" />
              <span>List View</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span className="text-sm">Show Available Only</span>
              </div>
              <Switch defaultChecked />
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Theme Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === "light" ? (
              <Sun className="mr-2 h-4 w-4" />
            ) : theme === "dark" ? (
              <Moon className="mr-2 h-4 w-4" />
            ) : (
              <Monitor className="mr-2 h-4 w-4" />
            )}
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => onThemeChange("light")}>
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onThemeChange("dark")}>
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onThemeChange("system")}>
              <Monitor className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* AI Assistant Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Volume2 className="mr-2 h-4 w-4" />
            <span>AI Assistant</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>Assistant Mode</DropdownMenuLabel>
            <DropdownMenuItem>Study Helper</DropdownMenuItem>
            <DropdownMenuItem>System Guide</DropdownMenuItem>
            <DropdownMenuItem>Technical Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Volume2 className="mr-2 h-4 w-4" />
                <span className="text-sm">Voice Response</span>
              </div>
              <Switch defaultChecked />
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Admin Only Settings */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Database className="mr-2 h-4 w-4" />
                <span>System Admin</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Admin
                </Badge>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  <Database className="mr-2 h-4 w-4" />
                  <span>Backup & Restore</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Activity className="mr-2 h-4 w-4" />
                  <span>Audit Logs</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>System Settings</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}