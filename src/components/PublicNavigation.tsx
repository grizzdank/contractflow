import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PublicNavigation = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-600">
        <img src="/logo-new-no-text.png" alt="ContractFlow Logo" className="h-8 w-auto" />
        <span>ContractFlo.ai</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/auth">
          <Button variant="ghost">Login</Button>
        </Link>
      </div>
    </div>
  </nav>
);

export default PublicNavigation; 