import { Bell, LogOut, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import logo from "@/assets/jrmsu-logo.jpg";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { NotificationsService } from "@/services/notifications";
import { NotificationsAPI, type NotificationItem } from "@/services/notificationsApi";
import { SettingsDropdown } from "@/components/settings/SettingsDropdown";
import { getViewportMode } from "@/hooks/useViewportMode";

interface NavbarProps {
  userType: "student" | "admin";
  theme?: "light" | "dark" | "system";
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

const Navbar = ({ userType, theme = "system", onThemeChange }: NavbarProps) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState<'all'|'unread'>('all');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string|undefined>(undefined);
  const [selected, setSelected] = useState<NotificationItem|undefined>(undefined);

  const reload = async (f: 'all'|'unread'=filter) => {
    try {
      if (!user?.id) return;
      const res = await NotificationsAPI.list({ userId: user.id, filter: f, page: 1, limit: 25 });
      // Ensure newest -> oldest
      const items = res.items.slice().sort((a,b)=> (a.created_at < b.created_at ? 1 : -1));
      setNotifications(items);
      setUnread(res.unread);
    } catch {
      const local = NotificationsService.list(user?.id);
      const items = local.map(n=>({
        id: n.id,
        user_id: user?.id || 'guest',
        title: 'Notification',
        body: n.message,
        type: n.type,
        created_at: new Date(n.createdAt).getTime()/1000,
        read: n.status === 'read',
      })) as NotificationItem[];
      setNotifications(items.sort((a,b)=> (a.created_at < b.created_at ? 1 : -1)));
      setUnread(local.filter(n=>n.status==='unread').length);
    }
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
    if (!user?.id) return;
    reload();
    const disconnect = NotificationsAPI.connect(user.id, {
      onNew: (n) => setNotifications((prev) => [n, ...prev.filter(p=>p.id!==n.id)]),
      onUpdate: (n) => setNotifications((prev) => prev.map(p=>p.id===n.id?n:p)),
      onMarkAll: () => setNotifications((prev)=>prev.map(p=>({...p, read: true}))),
    });
    return () => disconnect();
  }, [user?.id]);

  const unreadCount = useMemo(() => unread ?? notifications.filter((n) => !n.read).length, [unread, notifications]);
  const filteredNotifications = useMemo(() => (filter === 'unread' ? notifications.filter(n=>!n.read) : notifications), [notifications, filter]);

  const handleMarkAllRead = async () => {
    try {
      if (!user?.id) return;
      await NotificationsAPI.markAllRead(user.id);
      await reload(filter);
    } catch {
      const receiverId = user?.id || 'ADMIN';
      NotificationsService.markAllRead(receiverId);
      reload(filter);
    }
  };

  const openNotification = async (id: string) => {
    if (!user?.id) return;
    try {
      const n = await NotificationsAPI.get(user.id, id);
      setSelected(n);
      setSelectedId(id);
      setOverlayOpen(true);
      // Mark as read if not already
      if (!n.read) { await NotificationsAPI.markRead(user.id, [id]); await reload(filter); }
    } catch {}
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
              <DropdownMenuContent align="end" className="w-[90vw] sm:w-[26rem] max-w-[95vw]">
                <div className="p-2 border-b flex items-center justify-between gap-2 sticky top-0 bg-background z-10">
                  <h3 className="font-semibold">Notifications</h3>
                  <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" variant={filter==='all'?'default':'outline'} onClick={() => { setFilter('all'); reload('all'); }}>All</Button>
                    <Button size="sm" variant={filter==='unread'?'default':'outline'} onClick={() => { setFilter('unread'); reload('unread'); }}>Unread ({unreadCount})</Button>
                    <Button size="sm" onClick={handleMarkAllRead}>Mark all read</Button>
                  </div>
                </div>
                {filteredNotifications.slice(0, 25).map((n) => (
                  <DropdownMenuItem key={n.id} onClick={() => openNotification(n.id)}>
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{n.title || 'Notification'}</p>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                      <p className="text-xs text-muted-foreground">{new Date(n.created_at*1000).toLocaleString()}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
                {filteredNotifications.length === 0 && (
                  <div className="p-3 text-xs text-muted-foreground">No notifications</div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={overlayOpen} onOpenChange={setOverlayOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{selected?.title || 'Notification'}</DialogTitle>
                  <DialogDescription>{new Date((selected?.created_at||0)*1000).toLocaleString()}</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{selected?.body}</p>
                  {selected?.meta?.requestId && selected?.type === 'password_reset_request' && (
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" onClick={async ()=>{
                        try{
                          await fetch(`${location.origin.replace(/:\\d+$/,':5000')}/api/auth/admin-respond`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:selected?.meta?.requestId, action:'grant', adminId: user?.id||'ADMIN'})});
                          setOverlayOpen(false);
                        }catch{}
                      }}>Grant</Button>
                      <Button size="sm" variant="outline" onClick={async ()=>{
                        try{
                          await fetch(`${location.origin.replace(/:\\d+$/,':5000')}/api/auth/admin-respond`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:selected?.meta?.requestId, action:'decline', adminId: user?.id||'ADMIN'})});
                          setOverlayOpen(false);
                        }catch{}
                      }}>Decline</Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

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
