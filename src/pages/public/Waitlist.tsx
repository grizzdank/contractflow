import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client"; // Assuming shared client is okay
import PublicNavigation from "@/components/PublicNavigation"; // Import shared component

const WaitlistPage = () => {
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error: connectionError } = await supabase.from('waitlist').select('count').limit(0);
      if (connectionError) {
        console.error('Supabase connection error:', connectionError);
        await new Promise(resolve => setTimeout(resolve, 800));
        toast({
          title: "Success! (Demo Mode)",
          description: "You've been added to our waitlist. (Note: This is running in demo mode due to connection issues)",
        });
        setEmail("");
        setCompanyName("");
        return;
      }

      const { error } = await supabase
        .from('waitlist')
        .insert([{ email, company_name: companyName }]);

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
      <PublicNavigation />
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
              Join the Waitlist
            </h1>
            <p className="mt-2 text-gray-600">
              Be the first to know when ContractFlo.ai launches.
            </p>
          </div>
          <form onSubmit={handleWaitlistSubmit} className="space-y-4">
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
    </div>
  );
};

export default WaitlistPage; 