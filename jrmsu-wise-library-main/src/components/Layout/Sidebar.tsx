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

interface SidebarProps {
  userType: "student" | "admin";
}

const Sidebar = ({ userType }: SidebarProps) => {
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

  return (
    <aside className="bg-card border-r w-64 min-h-[calc(100vh-4rem)] shadow-sm">
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-smooth",
                "hover:bg-primary/10 hover:text-primary",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
