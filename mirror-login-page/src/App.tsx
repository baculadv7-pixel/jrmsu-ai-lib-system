import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { Suspense, lazy } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { LibrarySessionProvider } from "@/context/LibrarySessionContext";

// Route-level code splitting
const LibraryEntry = lazy(() => import("./pages/LibraryEntry"));

const queryClient = new QueryClient();

function RootLayout() {
  return (
    <LibrarySessionProvider>
      <Outlet />
    </LibrarySessionProvider>
  );
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <LibraryEntry /> },
        { path: "*", element: <LibraryEntry /> }, // Redirect all routes to library entry
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
