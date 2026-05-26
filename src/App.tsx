import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PageSkeleton } from "@/components/Skeletons";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Lazy-load heavier authenticated views and the public booking page.
const Billing = lazy(() => import("./pages/Billing"));
const DashboardHome = lazy(() => import("./pages/dashboard/Home"));
const AgendaPage = lazy(() => import("./pages/dashboard/Agenda"));
const ServicesPage = lazy(() => import("./pages/dashboard/Services"));
const ClientsPage = lazy(() => import("./pages/dashboard/Clients"));
const PaymentsPage = lazy(() => import("./pages/dashboard/Payments"));
const SettingsPage = lazy(() => import("./pages/dashboard/Settings"));
const BookingPage = lazy(() => import("./pages/public/BookingPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/recuperar" element={<ForgotPassword />} />
              <Route path="/r/:slug" element={<BookingPage />} />

              <Route
                path="/billing"
                element={
                  <ProtectedRoute>
                    <Billing />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardHome />} />
                <Route path="agenda" element={<AgendaPage />} />
                <Route path="servicios" element={<ServicesPage />} />
                <Route path="clientes" element={<ClientsPage />} />
                <Route path="pagos" element={<PaymentsPage />} />
                <Route path="configuracion" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
