import { useState, useEffect } from "react";
import { CheckCircle, User, Shield, Users, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/context/AuthContext";

interface WelcomeMessageProps {
  firstName: string;
  userRole: UserRole;
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
  mode?: "login" | "logout"; // New: support login and logout modes
}

export function WelcomeMessage({ 
  firstName, 
  userRole, 
  isVisible, 
  onComplete,
  duration = 2000,
  mode = "login" // Default to login mode
}: WelcomeMessageProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      
      // Auto-complete after duration
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          onComplete?.();
        }, 300); // Allow exit animation to complete
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isVisible, duration, onComplete]);

  if (!isVisible && !show) return null;

  const getRoleIcon = () => {
    switch (userRole) {
      case "admin":
        return <Shield className="h-6 w-6 text-blue-600" />;
      case "student":
        return <User className="h-6 w-6 text-green-600" />;
      default:
        return <Users className="h-6 w-6 text-gray-600" />;
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case "admin":
        return "bg-blue-50 border-blue-200";
      case "student":
        return "bg-green-50 border-green-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getRoleText = () => {
    switch (userRole) {
      case "admin":
        return "Administrator";
      case "student":
        return "Student";
      default:
        return "User";
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-all duration-300 ${
        show ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ backdropFilter: 'blur(4px)' }}
    >
      <Card 
        className={`w-full max-w-md mx-4 shadow-2xl transform transition-all duration-500 ${
          show ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'
        } ${getRoleColor()}`}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className={`h-20 w-20 ${mode === "logout" ? "bg-red-100" : "bg-green-100"} rounded-full flex items-center justify-center animate-pulse`}>
                {mode === "logout" ? (
                  <LogOut className="h-12 w-12 text-red-600" />
                ) : (
                  <CheckCircle className="h-12 w-12 text-green-600" />
                )}
              </div>
            </div>

            {/* Welcome/Logout Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">
                {mode === "logout" ? (
                  <>🔴 Account Logout!</>
                ) : (
                  <>🟢 Welcome, {firstName}!</>
                )}
              </h2>
              <p className="text-gray-600">
                {mode === "logout" ? (
                  "You have successfully logged out from the library."
                ) : (
                  "Login successful! Redirecting to your dashboard..."
                )}
              </p>
            </div>

            {/* User Role Badge */}
            <div className="flex justify-center">
              <Badge 
                variant="outline" 
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                  userRole === "admin" 
                    ? "border-blue-300 text-blue-700 bg-blue-50" 
                    : "border-green-300 text-green-700 bg-green-50"
                }`}
              >
                {getRoleIcon()}
                {getRoleText()}
              </Badge>
            </div>

            {/* Loading Animation */}
            {mode === "login" && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
                <p className="text-sm text-gray-500">
                  Preparing your workspace...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for managing welcome message state
export function useWelcomeMessage() {
  const [isVisible, setIsVisible] = useState(false);
  const [userData, setUserData] = useState<{
    firstName: string;
    userRole: UserRole;
    mode?: "login" | "logout";
  } | null>(null);

  const showWelcome = (firstName: string, userRole: UserRole, mode: "login" | "logout" = "login") => {
    setUserData({ firstName, userRole, mode });
    setIsVisible(true);
  };

  const hideWelcome = () => {
    setIsVisible(false);
    setUserData(null);
  };

  return {
    isVisible,
    userData,
    showWelcome,
    hideWelcome
  };
}