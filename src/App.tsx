import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkAuthProvider } from "@/contexts/ClerkAuthContext";

// Pages
import Auth from "@/pages/Auth";
import LandingPage from "@/pages/public/LandingPage";
import WaitlistPage from "@/pages/public/Waitlist";
import ContactPage from "@/pages/public/Contact";
import Index from "@/pages/dashboard/Index";
import Contracts from "@/pages/dashboard/Contracts";
import ContractDetails from "@/pages/dashboard/ContractDetails";
import ContractRequest from "@/pages/dashboard/ContractRequest";
import ContractApproval from "@/pages/dashboard/ContractApproval";
import Team from "@/pages/dashboard/Team";
import Notifications from "@/pages/dashboard/Notifications";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";

import { UserRole } from "@/domain/types/Auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ProtectedLayout from "@/components/ProtectedLayout";
import { clerkConfig } from "@/lib/clerk/client";
import "./App.css";

// Protected Routes Wrapper
const ProtectedRoutesWrapper = () => {
  console.log('[ProtectedRoutesWrapper] Rendering protected routes wrapper');
  return (
    <ClerkAuthProvider>
      <ProtectedLayout>
        <Routes>
          <Route index element={<Index />} />
          <Route path="contracts/request" element={<ProtectedRoute allowedRoles={[UserRole.ADMINISTRATOR, UserRole.MANAGER, UserRole.CONTRIBUTOR]}><ContractRequest /></ProtectedRoute>} />
          <Route path="approval" element={<ProtectedRoute allowedRoles={[UserRole.ADMINISTRATOR, UserRole.MANAGER, UserRole.REVIEWER]}><ContractApproval /></ProtectedRoute>} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="contracts/:contractNumber" element={<ContractDetails />} />
          <Route path="team" element={<ProtectedRoute allowedRoles={[UserRole.ADMINISTRATOR, UserRole.MANAGER]}><Team /></ProtectedRoute>} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ProtectedLayout>
    </ClerkAuthProvider>
  );
};

// Component to handle routing AFTER Clerk is loaded
const AppRoutes = () => {
  console.log('[AppRoutes] Rendering main routes');
  return (
    <Routes>
      {/* Public routes accessible to all */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/waitlist" element={<WaitlistPage />} />
      <Route path="/contact" element={<ContactPage />} />
      
      {/* Auth routes - Render Auth directly */}
      <Route 
        path="/auth"
        element={<Auth />}
      />
      <Route 
        path="/sign-up"
        element={<Auth />}
      />

      {/* Protected Routes: Use SignedIn wrapper */}
      <Route
        path="/dashboard/*"
        element={
           <SignedIn>
              <React.Suspense fallback={
                <div className="flex min-h-screen items-center justify-center">
                  <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-green-500" />
                </div>
              }>
                <ProtectedRoutesWrapper />
              </React.Suspense>
           </SignedIn>
        }
      />
      
      {/* Catch-all routes based on auth state */}
       <Route path="*" element={ 
          <SignedIn>
             <Navigate to="/dashboard" replace /> 
          </SignedIn> }
       />
       <Route path="*" element={ 
          <SignedOut>
            <Navigate to="/" replace />
          </SignedOut> }
       />
    </Routes>
  );
}

// Component to wait for Clerk to load before rendering routes
const ClerkLoadedGate = ({ children }: { children: React.ReactNode }) => {
  const { isLoaded } = useAuth();
  console.log('[ClerkLoadedGate] Clerk loaded state:', isLoaded);

  if (!isLoaded) {
     console.log('[ClerkLoadedGate] Clerk not loaded yet, rendering loading indicator');
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-green-500" />
      </div>
    );
  }

  console.log('[ClerkLoadedGate] Clerk loaded, rendering children (AppRoutes)');
  return <>{children}</>;
}

function App() {
  useEffect(() => {
    console.log('[App] Component mounted');
    return () => console.log('[App] Component unmounting');
  }, []);

  console.log('[App] Rendering');

  return (
    <ThemeProvider defaultTheme="system" storageKey="contractflo-theme">
      <Router>
         {/* ClerkProvider goes INSIDE Router and OUTSIDE ClerkLoadedGate */}
         <ClerkProvider {...clerkConfig}> 
           {/* Wait for Clerk to load before rendering routes */}
           <ClerkLoadedGate>
              <AppRoutes />
           </ClerkLoadedGate>
        </ClerkProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
