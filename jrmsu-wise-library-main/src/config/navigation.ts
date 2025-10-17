import { 
  BarChart3, 
  Book, 
  Users, 
  History, 
  Settings, 
  User, 
  LogOut, 
  BookOpen,
  PieChart,
  FileText,
  Library,
  Dashboard
} from "lucide-react";
import { UserRole } from "@/types/auth";

export interface NavItem {
  title: string;
  href: string;
  icon: any;
  description?: string;
  badge?: string;
}

export interface NavigationConfig {
  main: NavItem[];
  profile: NavItem;
  settings: NavItem;
  logout: NavItem;
}

export const adminNavigation: NavigationConfig = {
  main: [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: Dashboard,
      description: "Key metrics and system overview"
    },
    {
      title: "Book Inventory",
      href: "/admin/books",
      icon: Library,
      description: "Manage books, categories, and QR codes"
    },
    {
      title: "Student Management",
      href: "/admin/students",
      icon: Users,
      description: "Register, edit, or deactivate students"
    },
    {
      title: "Borrow/Return History",
      href: "/admin/history",
      icon: History,
      description: "All borrowing and return activities"
    },
    {
      title: "Reports",
      href: "/admin/reports",
      icon: FileText,
      description: "Export data and analytics"
    }
  ],
  profile: {
    title: "Profile",
    href: "/admin/profile",
    icon: User,
    description: "View and edit admin information"
  },
  settings: {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    description: "System and account settings"
  },
  logout: {
    title: "Logout",
    href: "/logout",
    icon: LogOut,
    description: "End current session"
  }
};

export const studentNavigation: NavigationConfig = {
  main: [
    {
      title: "Dashboard",
      href: "/student/dashboard",
      icon: Dashboard,
      description: "Your borrowed books and announcements"
    },
    {
      title: "Book Inventory",
      href: "/student/books",
      icon: BookOpen,
      description: "Browse and search available books"
    },
    {
      title: "System Analytics",
      href: "/student/analytics",
      icon: PieChart,
      description: "View borrowing statistics and trends"
    },
    {
      title: "Borrow/Return History",
      href: "/student/history",
      icon: History,
      description: "Your past borrowing activities"
    }
  ],
  profile: {
    title: "Profile",
    href: "/student/profile",
    icon: User,
    description: "View and edit your information"
  },
  settings: {
    title: "Settings",
    href: "/student/settings",
    icon: Settings,
    description: "Account and notification settings"
  },
  logout: {
    title: "Logout",
    href: "/logout",
    icon: LogOut,
    description: "End current session"
  }
};

export function getNavigationForRole(role: UserRole): NavigationConfig {
  return role === "admin" ? adminNavigation : studentNavigation;
}