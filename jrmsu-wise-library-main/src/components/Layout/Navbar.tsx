import { Bell, LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/jrmsu-logo.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { NotificationsService, type AppNotification } from "@/services/notifications";
import { SettingsDropdown } from "@/components/settings/SettingsDropdown";
import { getViewportMode } from "@/hooks/useViewportMode";

interface NavbarProps {
  userType: "student" | "admin";
  theme?: "light" | "dark" | "system";
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

const Navbar = ({ userType, theme = "system", onThemeChange }: NavbarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const reload = () => {
    setNotifications(NotificationsService.list());
  };

  const toggleSidebar = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const mode = getViewportMode(width);
    try {
      const ch = new BroadcastChannel('jrmsu_sidebar_channel');
      if (mode === 'mobile') {
        const KEY_M = 'jrmsu_sidebar_mobile_open';
        const isOpen = localStorage.getItem(KEY_M) === 'true';
        const next = !isOpen;
        localStorage.setItem(KEY_M, String(next));
        ch.postMessage({ type: 'mobile', value: next });
      } else {
        const KEY = 'jrmsu_sidebar_collapsed';
        const current = localStorage.getItem(KEY) === 'true';
        const next = !current;
        localStorage.setItem(KEY, String(next));
        ch.postMessage({ type: 'toggle', value: next });
      }
      ch.close();
    } catch {
      // Fallback if BroadcastChannel unsupported: set localStorage only
      if (mode === 'mobile') {
        const KEY_M = 'jrmsu_sidebar_mobile_open';
        const isOpen = localStorage.getItem(KEY_M) === 'true';
        localStorage.setItem(KEY_M, String(!isOpen));
      } else {
        const KEY = 'jrmsu_sidebar_collapsed';
        const current = localStorage.getItem(KEY) === 'true';
        localStorage.setItem(KEY, String(!current));
      }
    }
  };

  useEffect(() => {
    reload();
    const unsub = NotificationsService.subscribe(reload);
    return () => unsub();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => n.status === "unread").length, [notifications]);

  const [filter, setFilter] = useState<'all'|'unread'>('all');
  const filteredNotifications = useMemo(() => {
    return filter === 'unread' ? notifications.filter(n=>n.status==='unread') : notifications;
  }, [notifications, filter]);

  const handleMarkAllRead = () => {
    // Mark all for current user (ADMIN fallback)
    const receiverId = (typeof window !== 'undefined' && (window as any).currentUserId) || 'ADMIN';
    NotificationsService.markAllRead(receiverId);
    reload();
  };

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  return (
    <nav className="bg-navy border-b-2 border-secondary sticky top-0 z-[60]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src={logo} alt="JRMSU" className="h-10 w-10 object-contain" />
            <div className="text-navy-foreground">
              <h1 className="text-lg font-bold">JRMSU Library</h1>
              <p className="text-xs text-secondary">AI-Powered System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Main menu toggle - grows when sidebar is collapsed */}
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-navy-foreground hover:bg-navy-foreground/10">
              {/* reactively size via inline style based on localStorage */}
              <PanelLeft className="transition-all" style={{ height: (localStorage.getItem('jrmsu_sidebar_collapsed') === 'true') ? 24 : 20, width: (localStorage.getItem('jrmsu_sidebar_collapsed') === 'true') ? 24 : 20 }} />
            </Button>

            {/* Notification Bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-navy-foreground hover:bg-navy-foreground/10">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-secondary text-navy text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96">
                <div className="p-2 border-b flex items-center justify-between gap-2">
                  <h3 className="font-semibold">Notifications</h3>
                  <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setFilter('all')}>All</Button>
                    <Button size="sm" variant="outline" onClick={() => setFilter('unread')}>Unread</Button>
                    <Button size="sm" onClick={handleMarkAllRead}>Mark all read</Button>
                  </div>
                </div>
                {filteredNotifications.slice(0, 15).map((n) => (
                  <DropdownMenuItem key={n.id} onClick={() => NotificationsService.markRead(n.id)}>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{n.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
                {filteredNotifications.length === 0 && (
                  <div className="p-3 text-xs text-muted-foreground">No notifications</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings Dropdown */}
            <SettingsDropdown 
              theme={theme} 
              onThemeChange={onThemeChange || (() => {})} 
            />

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-navy-foreground hover:bg-navy-foreground/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
