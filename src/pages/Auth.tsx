import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Navigation from "@/components/Navigation";
import Squid from "@/components/Squid";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // For demo purposes, we'll just show a success message
        // instead of actually creating an account
        
        console.log('Sign up data:', {
          email,
          password,
          fullName,
          organizationName
        });
        
        toast({
          title: "Success!",
          description: "Account created successfully. You can now sign in.",
        });
        
        // Switch to sign in mode
        setIsSignUp(false);
        setPassword("");
      } else {
        // For demo purposes, we'll simulate a successful login
        console.log('Sign in attempt with:', { email });
        
        // Show success toast
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        
        // Navigate to home page
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred during authentication",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 pt-16">
        <div className="max-w-md mx-auto p-6">
          <Card>
            <CardHeader className="relative">
              <div className="absolute top-26 right-[34px] z-50">
                <Squid isPasswordFocused={isPasswordFocused} />
              </div>
              <CardTitle>{isSignUp ? "Create an account" : "Welcome back"}</CardTitle>
              <CardDescription>
                {isSignUp
                  ? "Sign up to start managing contracts"
                  : "Sign in to your account"}
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAuth}>
              <CardContent className="space-y-4">
                {isSignUp && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">Organization Name</Label>
                      <Input
                        id="organizationName"
                        placeholder="Acme Inc"
                        value={organizationName}
                        onChange={(e) => setOrganizationName(e.target.value)}
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
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  className="w-full"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp
                    ? "Already have an account? Sign in"
                    : "Don't have an account? Sign up"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Auth;
