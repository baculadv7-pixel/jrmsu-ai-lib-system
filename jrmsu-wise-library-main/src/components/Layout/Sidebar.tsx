import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  History,
  FileText,
  User,
  Settings,
  Users,
  BookMarked,
} from "lucide-react";
import { useViewportMode } from "@/hooks/useViewportMode";

interface SidebarProps {
  userType: "student" | "admin";
}

const Sidebar = ({ userType }: SidebarProps) => {
  const KEY = 'jrmsu_sidebar_collapsed';
  const MOBILE_KEY = 'jrmsu_sidebar_mobile_open';
  const mode = useViewportMode();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(KEY) === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState<boolean>(() => {
    try { return localStorage.getItem(MOBILE_KEY) === 'true'; } catch { return false; }
  });

  // Auto-collapse on tablet by default (first run only)
  useEffect(() => {
    if (mode === 'tablet') {
      try {
        const hasPref = localStorage.getItem(KEY);
        if (hasPref == null) {
          localStorage.setItem(KEY, 'true');
          setCollapsed(true);
        }
      } catch { /* noop */ }
    }
  }, [mode]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setCollapsed(e.newValue === 'true');
      if (e.key === MOBILE_KEY) setMobileOpen(e.newValue === 'true');
    };
    window.addEventListener('storage', onStorage);
    let ch: BroadcastChannel | null = null;
    try {
      ch = new BroadcastChannel('jrmsu_sidebar_channel');
      ch.onmessage = (e) => {
        if (e.data?.type === 'toggle') setCollapsed(Boolean(e.data.value));
        if (e.data?.type === 'mobile') setMobileOpen(Boolean(e.data.value));
      };
    } catch { /* noop */ }
    return () => { window.removeEventListener('storage', onStorage); try { if (ch) ch.close(); } catch { /* noop */ } };
  }, []);

  const studentNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, label: "Book Inventory", path: "/books" },
    { icon: History, label: "Borrow History", path: "/history" },
    { icon: Settings, label: "2FA Settings", path: "/settings" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const adminNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, label: "Book Inventory", path: "/books" },
    { icon: History, label: "Borrow/Return History", path: "/history" },
    { icon: Users, label: "Student Management", path: "/students" },
    { icon: Users, label: "Admin Management", path: "/admins" },
    { icon: BookMarked, label: "Book Management", path: "/book-management" },
    { icon: FileText, label: "Reports", path: "/reports" },
    { icon: Settings, label: "Authentication & 2FA", path: "/settings" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const navItems = userType === "admin" ? adminNavItems : studentNavItems;

  const AsideInner = (
    <nav className="p-2 space-y-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg transition-smooth",
              "hover:bg-primary/10 hover:text-primary",
              isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
            )
          }
        >
          <item.icon className="h-5 w-5 flex-none" />
          {(mode === 'mobile' || !collapsed) && (
            <span className="font-medium truncate whitespace-nowrap overflow-hidden flex-1 min-w-0">
              {item.label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  if (mode === 'mobile') {
    // Overlay drawer behavior on mobile
    return (
      <>
        {mobileOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/45" onClick={() => { localStorage.setItem(MOBILE_KEY, 'false'); setMobileOpen(false); }} />
            <aside className={cn(
              "absolute left-0 top-0 h-full w-[80vw] max-w-[18rem] bg-card border-r shadow-sm overflow-y-auto scroll-smooth transform transition-transform duration-200 z-50",
              mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
              {AsideInner}
            </aside>
          </div>
        )}
      </>
    );
  }

  return (
    <aside className={cn(
      "bg-card border-r shadow-sm overflow-y-auto scroll-smooth sticky top-16 self-start min-h-[calc(100vh-4rem)] h-[calc(100vh-4rem)] shrink-0 flex flex-col z-30",
      collapsed || mode === 'tablet' ? "w-16 min-w-16" : "w-64 min-w-64"
    )}>
      {AsideInner}
    </aside>
  );
};

export default Sidebar;
