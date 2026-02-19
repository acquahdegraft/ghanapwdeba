import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import About from "./pages/About";
import Membership from "./pages/Membership";
import PublicEvents from "./pages/PublicEvents";
import PublicResources from "./pages/PublicResources";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Directory from "./pages/Directory";
import MemberProfile from "./pages/MemberProfile";
import Events from "./pages/Events";
import Resources from "./pages/Resources";
import AdminDashboard from "./pages/AdminDashboard";
import CoordinatorDashboard from "./pages/CoordinatorDashboard";
import PaymentCallback from "./pages/PaymentCallback";
import HelpSupport from "./pages/HelpSupport";
import PaymentLogs from "./pages/PaymentLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/membership" element={<Membership />} />
            <Route path="/events" element={<PublicEvents />} />
            <Route path="/resources" element={<PublicResources />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/payments"
              element={
                <ProtectedRoute>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/payment-callback"
              element={
                <ProtectedRoute>
                  <PaymentCallback />
                </ProtectedRoute>
              }
            />
            {/* Public payment callback for registration payments (user not yet logged in) */}
            <Route path="/payment-callback" element={<PaymentCallback />} />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin/payment-logs"
              element={
                <ProtectedRoute requireAdmin>
                  <PaymentLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/coordinator"
              element={
                <ProtectedRoute>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/directory"
              element={
                <ProtectedRoute>
                  <Directory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/directory/:memberId"
              element={
                <ProtectedRoute>
                  <MemberProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/events"
              element={
                <ProtectedRoute>
                  <Events />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/resources"
              element={
                <ProtectedRoute>
                  <Resources />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/help"
              element={
                <ProtectedRoute>
                  <HelpSupport />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
