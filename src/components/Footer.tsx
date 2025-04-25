import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear(); // Use current year dynamically

  return (
    <footer className="mt-auto border-t bg-background py-4"> {/* mt-auto pushes footer down in flex layouts */}
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-x-4 gap-y-2">
          <span>© {currentYear} LFG Consulting, All rights reserved.</span>
          <div className="flex gap-x-4">
            <Link to="/terms" className="hover:text-primary hover:underline">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-primary hover:underline">
              Privacy Policy
            </Link>
            {/* Add Support link here later */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 