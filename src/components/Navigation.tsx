
import { Home, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
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
            <Button variant="ghost" className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>Sign In</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
