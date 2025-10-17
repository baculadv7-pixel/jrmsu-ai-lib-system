import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface RoleGuardProps {
  allowedRoles: ("admin" | "student")[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({ allowedRoles, children, redirectTo = "/dashboard" }: RoleGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }

    if (user && !allowedRoles.includes(user.role)) {
      toast.error(`Access denied. This page is restricted to ${allowedRoles.join(" and ")} users only.`);
      navigate(redirectTo);
      return;
    }
  }, [user, isAuthenticated, allowedRoles, navigate, redirectTo]);

  // Don't render anything while checking permissions
  if (!isAuthenticated || !user) {
    return null;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}