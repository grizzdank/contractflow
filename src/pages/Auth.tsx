import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Navigation from "@/components/Navigation";
import Squid from "@/components/Squid";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  // Get auth context and location
  const { authState, signIn, signUp, resetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Form states
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  
  // UI states
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Get loading state from auth context
  const isLoading = authState.isLoading;

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = () => {
      console.log('[Auth] Checking authentication status', { 
        user: authState.user ? 'exists' : 'none',
        session: authState.session ? 'exists' : 'none'
      });
      
      if (authState.user && authState.session) {
        console.log('[Auth] User is already authenticated, redirecting to home');
        
        // Get the intended destination from location state or default to home
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    };
    
    checkAuth();
  }, [authState.user, authState.session, navigate, location]);

  // Handle typing state for squid animation
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    setter(value);
    setIsTyping(true);
    
    // Reset typing animation after a short delay
    setTimeout(() => setIsTyping(false), 500);
  };

  // Handle sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Auth] Attempting sign in', { email });
    
    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('[Auth] Sign in failed', error);
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    } else {
      console.log('[Auth] Sign in successful');
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      
      // Get the intended destination from location state or default to home
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  };

  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Auth] Attempting sign up', { email, fullName, organizationName });
    
    const { error } = await signUp(email, password, fullName, organizationName);
    
    if (error) {
      console.error('[Auth] Sign up failed', error);
      toast({
        title: "Sign up failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
    } else {
      console.log('[Auth] Sign up successful, email verification required');
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account before signing in.",
      });
      
      // Reset form and switch to sign in mode
      setPassword("");
      setIsSignUp(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[Auth] Attempting password reset', { email });
    
    const { error } = await resetPassword(email);
    
    if (error) {
      console.error('[Auth] Password reset request failed', error);
      toast({
        title: "Password reset failed",
        description: error.message || "Please check your email and try again",
        variant: "destructive",
      });
    } else {
      console.log('[Auth] Password reset email sent');
      toast({
        title: "Password reset email sent",
        description: "Please check your email for instructions to reset your password.",
      });
      
      // Switch back to sign in mode
      setIsForgotPassword(false);
    }
  };

  // Handle form submission based on current mode
  const handleSubmit = (e: React.FormEvent) => {
    if (isSignUp) {
      handleSignUp(e);
    } else if (isForgotPassword) {
      handleResetPassword(e);
    } else {
      handleSignIn(e);
    }
  };

  // Reset form when switching between sign in and sign up
  const toggleSignUp = () => {
    setIsSignUp(!isSignUp);
    setPassword("");
    setIsForgotPassword(false);
  };

  // Toggle forgot password mode
  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setPassword("");
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
        <div className="max-w-md mx-auto p-6">
          <Card>
            <CardHeader className="relative">
              <div className="absolute top-26 right-[34px] z-50">
                <Squid 
                  isPasswordFocused={isPasswordFocused} 
                  isTyping={isTyping}
                  size="md"
                  color="teal"
                />
              </div>
              <CardTitle>
                {isSignUp 
                  ? "Create an account" 
                  : isForgotPassword 
                    ? "Reset your password" 
                    : "Welcome back"}
              </CardTitle>
              <CardDescription>
                {isSignUp
                  ? "Sign up to start managing contracts"
                  : isForgotPassword
                    ? "Enter your email to receive a password reset link"
                    : "Sign in to your account"}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => handleInputChange(setFullName, e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">Organization Name</Label>
                      <Input
                        id="organizationName"
                        placeholder="Acme Inc"
                        value={organizationName}
                        onChange={(e) => handleInputChange(setOrganizationName, e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => handleInputChange(setEmail, e.target.value)}
                    required
                  />
                </div>
                {!isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => handleInputChange(setPassword, e.target.value)}
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                      required
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading 
                    ? "Please wait..." 
                    : isSignUp 
                      ? "Sign Up" 
                      : isForgotPassword 
                        ? "Send Reset Link" 
                        : "Sign In"}
                </Button>
                
                {!isForgotPassword && (
                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={toggleSignUp}
                  >
                    {isSignUp
                      ? "Already have an account? Sign in"
                      : "Don't have an account? Sign up"}
                  </Button>
                )}
                
                {!isSignUp && (
                  <Button
                    type="button"
                    variant="link"
                    className="w-full"
                    onClick={toggleForgotPassword}
                  >
                    {isForgotPassword
                      ? "Back to sign in"
                      : "Forgot your password?"}
                  </Button>
                )}
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Auth;
