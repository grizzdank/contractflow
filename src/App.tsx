import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Contracts from "@/pages/Contracts";
import ContractRequest from "@/pages/ContractRequest";
import ContractApproval from "@/pages/ContractApproval";
import ContractDetails from "@/pages/ContractDetails";
import Team from "@/pages/Team";
import NotFound from "@/pages/NotFound";
import Notifications from "@/pages/Notifications";
import Unauthorized from "@/pages/Unauthorized";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ProtectedLayout from "@/components/ProtectedLayout";
import { ClerkAuthProvider } from "@/contexts/ClerkAuthContext";
import { UserRole } from "@/domain/types/Auth";
import { clerkConfig } from "@/lib/clerk/client";
import InitializeClerkSession from "@/components/InitializeClerkSession";
import "./App.css";

// Helper component to encapsulate the protected providers + layout
const ProtectedRoutesWrapper = () => {
  return (
    <SignedIn>
      <ClerkAuthProvider>
        <InitializeClerkSession>
          <ProtectedLayout /> {/* Renders layout + Outlet */}
        </InitializeClerkSession>
      </ClerkAuthProvider>
    </SignedIn>
  );
};

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="contractflo-theme">
      <ClerkProvider {...clerkConfig}>
        <Router>
          <Routes>
            {/* Public routes accessible to all */}
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
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes: Rendered only for signed-in users */}
            <Route 
              path="/*"
              element={ 
                <React.Suspense fallback={<div>Loading App...</div>}> {/* Optional: Suspense for lazy loading */} 
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
              {/* These paths are relative to the parent '*' path */} 
              <Route index element={<Index />} /> {/* Default route for '/' */}
              <Route path="contracts" element={<Contracts />} />
              <Route path="contracts/:contractNumber" element={<ContractDetails />} />
              <Route 
                path="request" 
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
              <Route 
                path="team" 
                element={
                  <ProtectedRoute allowedRoles={[UserRole.ADMINISTRATOR, UserRole.MANAGER]}>
                     <Team />
                  </ProtectedRoute>
                 }
              />
              <Route path="notifications" element={<Notifications />} />
              <Route path="*" element={<NotFound />} /> {/* Catch-all inside protected layout */}
            </Route>
          </Routes>
        </Router>
      </ClerkProvider>
    </ThemeProvider>
  );
}

export default App;
