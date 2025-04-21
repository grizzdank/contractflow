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

const Navigation = () => {
  const { signOut } = useClerk();
  const { user, isSignedIn } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
      toast({
        description: "Signed out successfully",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "An error occurred while signing out",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/">
            <Button variant="ghost" className="flex items-center gap-2">
              <img src="/logo-new.png" alt="ContractFlo Logo" className="h-8 w-auto mr-2" />
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Button>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/contracts">
              <Button variant="ghost">Contracts</Button>
            </Link>
            <Link to="/request">
              <Button variant="ghost">Request</Button>
            </Link>
            <Link to="/team">
              <Button variant="ghost">Team</Button>
            </Link>
            {isSignedIn ? (
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

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/contracts" className="w-full">
                    Contracts
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/request" className="w-full">
                    Request
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/team" className="w-full">
                    Team
                  </Link>
                </DropdownMenuItem>
                {isSignedIn ? (
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link to="/auth" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
