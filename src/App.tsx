import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkAuthProvider } from "@/contexts/ClerkAuthContext";

// Pages
import Auth from "@/pages/Auth";
import Index from "@/pages/Index";
import Contracts from "@/pages/Contracts";
import ContractDetails from "@/pages/ContractDetails";
import ContractRequest from "@/pages/ContractRequest";
import ContractApproval from "@/pages/ContractApproval";
import Team from "@/pages/Team";
import Notifications from "@/pages/Notifications";
import NotFound from "@/pages/NotFound";
import Unauthorized from "@/pages/Unauthorized";

import { UserRole } from "@/domain/types/Auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ProtectedLayout from "@/components/ProtectedLayout";
import { clerkConfig } from "@/lib/clerk/client";
import "./App.css";

// Helper component to encapsulate the protected providers + layout
const ProtectedRoutesWrapper = () => {
  console.log('[ProtectedRoutesWrapper] Rendering');
  return (
    <SignedIn>
      <ClerkAuthProvider>
        <ProtectedLayout />
      </ClerkAuthProvider>
    </SignedIn>
  );
};

function App() {
  useEffect(() => {
    console.log('[App] Component mounted');
    return () => console.log('[App] Component unmounting');
  }, []);

  console.log('[App] Rendering');

  return (
    <ThemeProvider defaultTheme="system" storageKey="contractflo-theme">
      <ClerkProvider {...clerkConfig}>
        <Router>
          <Routes>
            {/* Public routes accessible to all */}
            <Route 
              path="/"
              element={
                <SignedOut>
                  <Navigate to="/auth" replace />
                </SignedOut>
              }
            />
            <Route 
              path="/auth"
              element={
                <SignedOut>
                  <Auth />
                </SignedOut>
              }
            />
            <Route 
              path="/sign-up"
              element={
                <SignedOut>
                  <Auth />
                </SignedOut>
              }
            />

            {/* Protected Routes: Rendered only for signed-in users */}
            <Route 
              path="/*"
              element={
                <React.Suspense fallback={<div>Loading App...</div>}>
                  <SignedIn>
                    <ProtectedRoutesWrapper />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </React.Suspense>
              }
            >
              {/* Define routes nested *within* the ProtectedRoutesWrapper layout */}
              {/* Specific routes first */}
              <Route index element={<Index />} /> 
              <Route 
                path="contracts/request"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.ADMINISTRATOR, UserRole.MANAGER, UserRole.CONTRIBUTOR]}>
                    <ContractRequest />
                  </ProtectedRoute>
                }
              />
              <Route 
                path="approval" 
                element={
                  <ProtectedRoute allowedRoles={[UserRole.ADMINISTRATOR, UserRole.MANAGER, UserRole.REVIEWER]}>
                    <ContractApproval />
                  </ProtectedRoute>
                }
              />
              <Route path="contracts" element={<Contracts />} />
              {/* Dynamic route last */}
              <Route path="contracts/:contractNumber" element={<ContractDetails />} /> 
              {/* <Route 
                path="team" 
                element={
                  <ProtectedRoute allowedRoles={[UserRole.ADMINISTRATOR, UserRole.MANAGER]}>
                    <Team />
                  </ProtectedRoute>
                }
              /> */}
              <Route path="notifications" element={<Notifications />} />
              <Route path="unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Router>
      </ClerkProvider>
    </ThemeProvider>
  );
}

export default App;
