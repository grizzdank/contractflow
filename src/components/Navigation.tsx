import { Home, User, LogOut, Menu } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useClerk, useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect } from 'react';

const Navigation = () => {
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('[Navigation] Component state:', {
      isUserLoaded,
      isSignedIn,
      hasUser: !!user,
      userEmail: user?.primaryEmailAddress?.emailAddress
    });
  }, [isUserLoaded, isSignedIn, user]);

  const handleSignOut = async () => {
    try {
      console.log('[Navigation] Initiating sign out');
      await signOut();
      navigate("/");
      toast({
        description: "Signed out successfully",
      });
      console.log('[Navigation] Sign out successful');
    } catch (error) {
      console.error('[Navigation] Sign out error:', error);
      toast({
        title: "Error signing out",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  if (!isUserLoaded) {
    console.log('[Navigation] User state loading');
    return null;
  }

  if (!isSignedIn || !user) {
    console.log('[Navigation] No authenticated user, not rendering navigation');
    return null;
  }

  console.log('[Navigation] Rendering navigation for authenticated user');
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <img src="/logo-new-no-text.png" alt="ContractFlow Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold">ContractFlo.ai</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard/contracts">
              <Button variant="ghost">Contracts</Button>
            </Link>
            <Link to="/dashboard/team">
              <Button variant="ghost">Team</Button>
            </Link>
            <Link to="/dashboard/notifications">
              <Button variant="ghost">Notifications</Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </Button>
          </div>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/contracts" className="w-full">
                    Contracts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/team" className="w-full">
                    Team
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/notifications" className="w-full">
                    Notifications
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
