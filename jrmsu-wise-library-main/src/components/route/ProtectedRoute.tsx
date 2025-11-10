import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({
  children,
  allow,
}: {
  children: JSX.Element;
  allow?: Array<"student" | "admin">;
}) {
  const { isAuthenticated, user } = useAuth();
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
  if (!hasToken && !isAuthenticated) return <Navigate to="/" replace />;
  if (allow && user && !allow.includes(user.role)) {
    // Redirect users without permission to a safe page
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}


