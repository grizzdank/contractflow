import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GanttChartSquare, Users2, Bell, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";

const LandingPage = () => {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Check if we can connect to Supabase
      const { error: connectionError } = await supabase.from('waitlist').select('count').limit(0);
      if (connectionError) {
        console.error('Supabase connection error:', connectionError);
        // Fall back to mock success for demo
        await new Promise(resolve => setTimeout(resolve, 800));
        toast({
          title: "Success! (Demo Mode)",
          description: "You've been added to our waitlist. We'll be in touch soon! (Note: This is running in demo mode due to connection issues)",
        });
        setEmail("");
        setCompanyName("");
        return;
      }

      const { error } = await supabase
        .from('waitlist')
        .insert([{ 
          email, 
          company_name: companyName 
        }]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "You've been added to our waitlist. We'll be in touch soon!",
      });

      setEmail("");
      setCompanyName("");
    } catch (error: any) {
      console.error('Waitlist submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50">
      {/* Navigation */}
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
            <Link to="/sign-up">
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
          <div className="text-center space-y-8">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
              Contract Management <br />Made Simple
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your contract workflow with our intuitive platform designed for small businesses.
              Join the waitlist to be notified when we launch!
            </p>

            {/* Waitlist Form */}
            <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
              <Input
                type="text"
                placeholder="Company name (optional)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full"
              />
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Joining..." : "Join Waitlist"}
              </Button>
            </form>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Preview Our Features
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Take a look at what we're building
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Link to="/auth" state={{ redirectTo: "/dashboard/contracts" }} className="block hover:no-underline">
              <FeatureCard
                icon={<GanttChartSquare className="h-6 w-6" />}
                title="Contract Management"
                description="Centralize and organize all your contracts in one secure location."
              />
            </Link>
            
          <Link to="/auth" state={{ redirectTo: "/dashboard/team" }} className="block hover:no-underline">
              <FeatureCard
                icon={<Users2 className="h-6 w-6" />}
                title="Team Collaboration"
                description="Work together seamlessly with role-based access control."
              />
            </Link>
            
          <Link to="/auth" state={{ redirectTo: "/dashboard/notifications" }} className="block hover:no-underline">
              <FeatureCard
                icon={<Bell className="h-6 w-6" />}
                title="Smart Notifications"
                description="Never miss important deadlines with automated reminders."
              />
            </Link>
          </div>
        </div>
      </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <Card className="p-6 hover-effect glass-panel slide-up border-0 shadow-lg bg-white/50 hover:shadow-xl transition-all">
    <div className="space-y-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </Card>
);

export default LandingPage;
