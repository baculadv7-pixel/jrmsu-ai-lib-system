import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/route/ProtectedRoute";
import { RoleGuard } from "@/components/route/RoleGuard";
import { RegistrationProvider } from "@/context/RegistrationContext";
import ErrorBoundary from "@/components/common/ErrorBoundary";

// Route-level code splitting
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Books = lazy(() => import("./pages/Books"));
const EnhancedProfile = lazy(() => import("./pages/EnhancedProfile"));
const SecurityDemo = lazy(() => import("./pages/SecurityDemo"));
const History = lazy(() => import("./pages/History"));
const Reports = lazy(() => import("./pages/Reports"));
const AppAdminQRs = lazy(() => import("./pages/AppAdminQRs"));
const Settings = lazy(() => import("./pages/Settings"));
const StudentManagement = lazy(() => import("./pages/StudentManagement"));
const AdminManagement = lazy(() => import("./pages/AdminManagement"));
const BookManagement = lazy(() => import("./pages/BookManagement"));
const Registration = lazy(() => import("./pages/Registration"));
const RegistrationSelect = lazy(() => import("./pages/RegistrationSelect"));
const RegistrationPersonal = lazy(() => import("./pages/RegistrationPersonal"));
const RegistrationInstitution = lazy(() => import("./pages/RegistrationInstitution"));
const RegistrationSecurity = lazy(() => import("./pages/RegistrationSecurity"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Import QR test utilities only in development (excluded from prod bundle)
if (import.meta.env.DEV) {
  import("./utils/qr-test");
  import("./utils/qr-e2e-test");
  import("./utils/qr-scannability-test");
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <RegistrationProvider>
            <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
              <Routes>
                <Route path="/" element={<Login />} />
                {/* Registration wizard - 4 separated pages */}
                <Route path="/register" element={<RegistrationSelect />} />
                <Route path="/register/select" element={<RegistrationSelect />} />
                <Route path="/register/personal" element={<RegistrationPersonal />} />
                <Route path="/register/institution" element={<RegistrationInstitution />} />
                <Route path="/register/security" element={<RegistrationSecurity />} />

                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/qrs"
                  element={
                    <ProtectedRoute allow={["admin"]}>
                      <AppAdminQRs />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/books"
                  element={
                    <ProtectedRoute>
                      <Books />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <RoleGuard allowedRoles={["admin"]}>
                        <Reports />
                      </RoleGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Settings />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <EnhancedProfile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/students"
                  element={
                    <ProtectedRoute allow={["admin"]}>
                      <StudentManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admins"
                  element={
                    <ProtectedRoute allow={["admin"]}>
                      <AdminManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/book-management"
                  element={
                    <ProtectedRoute allow={["admin"]}>
                      <BookManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/security-demo"
                  element={
                    <ProtectedRoute>
                      <SecurityDemo />
                    </ProtectedRoute>
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RegistrationProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
