import { Bell, LogOut } from "lucide-react";
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

interface NavbarProps {
  userType: "student" | "admin";
}

const Navbar = ({ userType }: NavbarProps) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const reload = () => {
    setNotifications(NotificationsService.list());
  };

  useEffect(() => {
    reload();
    const unsub = NotificationsService.subscribe(reload);
    return () => unsub();
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => n.status === "unread").length, [notifications]);

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  return (
    <nav className="bg-navy border-b-2 border-secondary sticky top-0 z-50">
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
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                {notifications.slice(0, 10).map((n) => (
                  <DropdownMenuItem key={n.id} onClick={() => NotificationsService.markRead(n.id)}>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{n.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
                {notifications.length === 0 && (
                  <div className="p-3 text-xs text-muted-foreground">No notifications</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

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
