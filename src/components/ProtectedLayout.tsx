import React from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from '@/components/Navigation'; // Or your main navigation component

// This component wraps all authenticated routes
// It assumes it's rendered within ClerkAuthProvider and InitializeClerkSession
const ProtectedLayout = () => {
  // You could add layout elements here if needed (e.g., sidebar, header for authed users)
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation /> {/* Example: Navigation for authenticated users */}
      <main className="flex-grow container mx-auto p-4">
        {/* Outlet renders the matched nested route component (e.g., Index, Contracts) */}
        <Outlet /> 
      </main>
      {/* Footer if needed */}
    </div>
  );
};

export default ProtectedLayout;
