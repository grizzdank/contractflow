
import { Home, User, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Navigation = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/auth");
      toast({
        description: "Signed out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/contracts">
              <Button variant="ghost">Contracts</Button>
            </Link>
            <Link to="/request">
              <Button variant="ghost">Request</Button>
            </Link>
            <Link to="/team">
              <Button variant="ghost">Team</Button>
            </Link>
            {user ? (
              <Button
                variant="ghost"
                className="flex items-center gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span>Sign In</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
