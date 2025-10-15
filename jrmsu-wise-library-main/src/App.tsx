import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Profile from "./pages/Profile";
import History from "./pages/History";
import Reports from "./pages/Reports";
import AppAdminQRs from "./pages/AppAdminQRs";
import Settings from "./pages/Settings";
import StudentManagement from "./pages/StudentManagement";
import BookManagement from "./pages/BookManagement";
import Registration from "./pages/Registration";
import RegistrationSelect from "./pages/RegistrationSelect";
import RegistrationPersonal from "./pages/RegistrationPersonal";
import RegistrationInstitution from "./pages/RegistrationInstitution";
import RegistrationSecurity from "./pages/RegistrationSecurity";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/route/ProtectedRoute";
import { RegistrationProvider } from "@/context/RegistrationContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <RegistrationProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              {/* Registration wizard */}
              <Route path="/register" element={<RegistrationSelect />} />
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
                <ProtectedRoute allow={["admin"]}>
                  <Reports />
                </ProtectedRoute>
              }
            />
              <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
              <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
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
              path="/book-management"
              element={
                <ProtectedRoute allow={["admin"]}>
                  <BookManagement />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </RegistrationProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
