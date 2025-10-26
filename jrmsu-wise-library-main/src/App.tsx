import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { PreferenceService } from "@/services/preferences";
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
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));

// Dev-only test utilities removed to avoid shipping demo/test files

const queryClient = new QueryClient();

function RouteTracker() {
  const loc = useLocation();
  const { user } = useAuth();
  useEffect(() => {
    try { PreferenceService.save(user?.id ?? 'guest', { lastPage: loc.pathname }); } catch {}
  }, [loc.pathname, user?.id]);
  return null;
}

function PrefetchRoutes() {
  useEffect(() => {
    // Warm up route chunks to avoid Suspense flashes on navigation
    const pages = [
      import("./pages/Dashboard"),
      import("./pages/Books"),
      import("./pages/History"),
      import("./pages/Reports"),
      import("./pages/Settings"),
      import("./pages/EnhancedProfile"),
      import("./pages/StudentManagement"),
      import("./pages/AdminManagement"),
      import("./pages/BookManagement"),
    ];
    Promise.allSettled(pages);
  }, []);
  return null;
}

function RootLayout() {
  return (
    <RegistrationProvider>
      <RouteTracker />
      <PrefetchRoutes />
      <Outlet />
    </RegistrationProvider>
  );
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <Login /> },
        { path: "register", element: <RegistrationSelect /> },
        { path: "register/select", element: <RegistrationSelect /> },
        { path: "register/personal", element: <RegistrationPersonal /> },
        { path: "register/institution", element: <RegistrationInstitution /> },
        { path: "register/security", element: <RegistrationSecurity /> },
        { path: "dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
        { path: "admin/qrs", element: <ProtectedRoute allow={["admin"]}><AppAdminQRs /></ProtectedRoute> },
        { path: "books", element: <ProtectedRoute><Books /></ProtectedRoute> },
        { path: "history", element: <ProtectedRoute><History /></ProtectedRoute> },
        { path: "reports", element: <ProtectedRoute><RoleGuard allowedRoles={["admin"]}><Reports /></RoleGuard></ProtectedRoute> },
        { path: "settings", element: <ProtectedRoute><ErrorBoundary><Settings /></ErrorBoundary></ProtectedRoute> },
        { path: "profile", element: <ProtectedRoute><EnhancedProfile /></ProtectedRoute> },
        { path: "students", element: <ProtectedRoute allow={["admin"]}><StudentManagement /></ProtectedRoute> },
        { path: "admins", element: <ProtectedRoute allow={["admin"]}><AdminManagement /></ProtectedRoute> },
        { path: "book-management", element: <ProtectedRoute allow={["admin"]}><BookManagement /></ProtectedRoute> },
        { path: "security-demo", element: <ProtectedRoute><SecurityDemo /></ProtectedRoute> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading…</div>}>
          <RouterProvider router={router} />
        </Suspense>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
