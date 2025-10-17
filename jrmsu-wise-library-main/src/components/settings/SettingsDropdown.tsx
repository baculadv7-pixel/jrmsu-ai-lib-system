import { useState } from "react";
import { 
  Settings, 
  User, 
  Shield, 
  Moon, 
  Sun, 
  Monitor,
  ChevronRight,
  ChevronDown,
  Lock,
  Mail,
  Smartphone,
  Activity,
  Key,
  Eye,
  Timer,
  Grid,
  List,
  Filter,
  Bell,
  Volume2,
  Database,
  RefreshCw,
  FileText,
  RotateCw
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
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface SettingsDropdownProps {
  theme: "light" | "dark" | "system";
  onThemeChange: (theme: "light" | "dark" | "system") => void;
}

export function SettingsDropdown({ theme, onThemeChange }: SettingsDropdownProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.role === "admin";

  // Mock settings state - replace with actual context/store
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsReminders: false,
    pushNotifications: true,
    showAvailableOnly: true,
    bookView: "grid" as "list" | "grid" | "compact",
    autoLogoutTimer: 30,
    voiceResponse: true,
    assistantMode: "Study Helper" as "Study Helper" | "System Guide" | "Technical Support"
  });

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light": return <Sun className="mr-2 h-4 w-4" />;
      case "dark": return <Moon className="mr-2 h-4 w-4" />;
      default: return <Monitor className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="text-navy-foreground hover:bg-navy-foreground/10">
          <Settings className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Profile */}
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        {/* Authentication & 2FA */}
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Shield className="mr-2 h-4 w-4" />
          <span>Authentication & 2FA</span>
        </DropdownMenuItem>

        {/* Theme Selection */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {getThemeIcon()}
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

        <DropdownMenuSeparator />

        {/* Account Settings */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Lock className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              <Lock className="mr-2 h-4 w-4" />
              <span>Change Password</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Mail className="mr-2 h-4 w-4" />
              <span>Manage Email/Mobile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Activity className="mr-2 h-4 w-4" />
              <span>Session History</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Key className="mr-2 h-4 w-4" />
              <span>Recovery Options</span>
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
            <DropdownMenuItem onClick={() => handleSettingChange("bookView", "list")}>
              <List className="mr-2 h-4 w-4" />
              <span>List View</span>
              {settings.bookView === "list" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSettingChange("bookView", "grid")}>
              <Grid className="mr-2 h-4 w-4" />
              <span>Grid View</span>
              {settings.bookView === "grid" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSettingChange("bookView", "compact")}>
              <Filter className="mr-2 h-4 w-4" />
              <span>Compact View</span>
              {settings.bookView === "compact" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <span className="text-sm">Show Available Only</span>
              </div>
              <Switch
                checked={settings.showAvailableOnly}
                onCheckedChange={(checked) => handleSettingChange("showAvailableOnly", checked)}
              />
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Privacy & Security */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Shield className="mr-2 h-4 w-4" />
            <span>Privacy & Security</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              <span>Manage Data Access</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Activity className="mr-2 h-4 w-4" />
              <span>Recent Account Activity</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Timer className="mr-2 h-4 w-4" />
              <span>Auto-Logout Timer</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {settings.autoLogoutTimer}m
              </Badge>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* Notification & Alerts */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications & Alerts</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                <span className="text-sm">Email Notifications</span>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
              />
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Smartphone className="mr-2 h-4 w-4" />
                <span className="text-sm">SMS Reminders</span>
              </div>
              <Switch
                checked={settings.smsReminders}
                onCheckedChange={(checked) => handleSettingChange("smsReminders", checked)}
              />
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                <span className="text-sm">Push Notifications</span>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
              />
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* AI Assistant Customization */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Volume2 className="mr-2 h-4 w-4" />
            <span>AI Assistant</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuLabel>Assistant Mode</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleSettingChange("assistantMode", "Study Helper")}>
              <span>Study Helper</span>
              {settings.assistantMode === "Study Helper" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSettingChange("assistantMode", "System Guide")}>
              <span>System Guide</span>
              {settings.assistantMode === "System Guide" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleSettingChange("assistantMode", "Technical Support")}>
              <span>Technical Support</span>
              {settings.assistantMode === "Technical Support" && <span className="ml-auto">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex items-center justify-between">
              <div className="flex items-center">
                <Volume2 className="mr-2 h-4 w-4" />
                <span className="text-sm">Voice Response</span>
              </div>
              <Switch
                checked={settings.voiceResponse}
                onCheckedChange={(checked) => handleSettingChange("voiceResponse", checked)}
              />
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        {/* System Administrator (Admin Only) */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Database className="mr-2 h-4 w-4" />
                <span>System Administrator</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  Admin
                </Badge>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>
                  <Database className="mr-2 h-4 w-4" />
                  <span>Backup & Restore Database</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Sync or Rebuild QR Codes</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Audit Logs</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RotateCw className="mr-2 h-4 w-4" />
                  <span>System Version / Updates</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}