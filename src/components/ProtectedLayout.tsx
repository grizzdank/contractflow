import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  // Temporarily bypass authentication checks
  return <>{children}</>;
};

export default ProtectedLayout;
