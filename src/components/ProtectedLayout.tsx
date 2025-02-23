
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // If we're on the auth page and user is logged in, redirect to home
        if (location.pathname === "/auth" && session) {
          navigate("/");
          return;
        }
        
        // If we're not on the auth page and user is not logged in, redirect to auth
        if (location.pathname !== "/auth" && !session) {
          navigate("/auth");
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/auth");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (location.pathname === "/auth" && session) {
        navigate("/");
      } else if (location.pathname !== "/auth" && !session) {
        navigate("/auth");
      }
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedLayout;
