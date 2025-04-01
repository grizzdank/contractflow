import { useNavigate, useLocation } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { useTheme } from "@/components/theme-provider";
import Navigation from "@/components/Navigation";

const Auth = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Determine if we're in sign up mode from the URL
  const isSignUp = location.pathname === "/sign-up";

  // Handle successful authentication
  const handleComplete = () => {
    // Get the intended destination from location state or default to home
    const from = location.state?.from?.pathname || "/";
    navigate(from, { replace: true });
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 dark:from-green-950 dark:via-background dark:to-orange-950 pt-16">
        <div className="max-w-md mx-auto p-6">
          {isSignUp ? (
            <SignUp
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: {
                  card: "shadow-none",
                  rootBox: "w-full",
                  formButtonPrimary: 
                    "bg-primary hover:bg-primary/90 text-primary-foreground shadow-none",
                }
              }}
              redirectUrl={location.state?.from?.pathname || "/"}
              afterSignUpUrl={location.state?.from?.pathname || "/"}
              signInUrl="/auth"
            />
          ) : (
            <SignIn
              appearance={{
                baseTheme: theme === "dark" ? dark : undefined,
                elements: {
                  card: "shadow-none",
                  rootBox: "w-full",
                  formButtonPrimary: 
                    "bg-primary hover:bg-primary/90 text-primary-foreground shadow-none",
                }
              }}
              redirectUrl={location.state?.from?.pathname || "/"}
              afterSignInUrl={location.state?.from?.pathname || "/"}
              signUpUrl="/sign-up"
            />
          )}
        </div>
      </div>
    </>
  );
};

export default Auth;
