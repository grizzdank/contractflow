import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { ThemeProvider } from "./components/theme-provider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Contracts from "./pages/Contracts";
import ContractRequest from "./pages/ContractRequest";
import ContractApproval from "./pages/ContractApproval";
import ContractDetails from "./pages/ContractDetails";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import { ClerkAuthProvider } from "./contexts/ClerkAuthContext";
import { UserRole } from "./domain/types/Auth";
import { clerkConfig } from "./lib/clerk/client";
import "./App.css";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="contractflow-theme">
      <ClerkProvider {...clerkConfig}>
        <ClerkAuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/sign-up" element={<Auth />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected routes - require authentication */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/contracts" 
                element={
                  <ProtectedRoute>
                    <Contracts />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/contracts/:contractNumber" 
                element={
                  <ProtectedRoute>
                    <ContractDetails />
                  </ProtectedRoute>
                } 
              />
              
              {/* Routes that require specific roles */}
              <Route 
                path="/request" 
                element={
                  <ProtectedRoute requiredRoles={[UserRole.ADMINISTRATOR, UserRole.MANAGER, UserRole.CONTRIBUTOR]}>
                    <ContractRequest />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/approval" 
                element={
                  <ProtectedRoute requiredRoles={[UserRole.ADMINISTRATOR, UserRole.MANAGER, UserRole.REVIEWER]}>
                    <ContractApproval />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/team" 
                element={
                  <ProtectedRoute requiredRoles={[UserRole.ADMINISTRATOR, UserRole.MANAGER]}>
                    <Team />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/notifications" 
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </ClerkAuthProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}

export default App;
