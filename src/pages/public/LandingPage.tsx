import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GanttChartSquare, Users2, Bell, Calendar, ArrowRight, Search, FileClock, PenTool, BarChart3, KeyRound, Workflow } from "lucide-react";
import { Link } from "react-router-dom";
import PublicNavigation from "@/components/PublicNavigation";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import Footer from "@/components/Footer";

const LandingPage = () => {
  return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50">
      {/* Use Shared Navigation */}
      <PublicNavigation />

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-16">
          <div className="text-center space-y-8">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
              Contract Management <br />Made Simple
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline your contract workflow with our intuitive platform designed for small businesses.
            </p>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Core Features
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to manage contracts efficiently.
            </p>
          </div>

          {/* Updated Feature Grid - No longer links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<GanttChartSquare className="h-6 w-6" />}
                title="Centralized Repository"
                description="Organize all contracts and related documents in one secure, accessible place."
              />
              <FeatureCard
                icon={<Bell className="h-6 w-6" />}
                title="Automated Reminders"
                description="Never miss key dates like renewals or expirations with smart notifications."
              />
              <FeatureCard
                icon={<PenTool className="h-6 w-6" />}
                title="E-Signature Integration"
                description="Streamline approvals with built-in support for leading e-signature providers."
              />
              <FeatureCard
                icon={<Search className="h-6 w-6" />}
                title="Advanced Search & Filter"
                description="Quickly find any contract or clause with powerful search capabilities."
              />
              <FeatureCard
                icon={<Users2 className="h-6 w-6" />}
                title="Team Collaboration"
                description="Work together seamlessly with role-based access and commenting."
              />
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6" />}
                title="Reporting & Analytics"
                description="Gain insights into your contract portfolio with customizable reports."
              />
          </div>

          {/* Combined CTA Section */} 
          <div className="text-center mt-16"> 
            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Ready to Learn More?</h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Join the waitlist for launch notifications or contact our team to discuss pricing and features.
            </p>
            {/* Button Group */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
               {/* ADD Waitlist button link here */}
              <Link to="/waitlist">
                <Button 
                  size="lg" 
                  variant="outline" /* Changed variant */
                  className="hover-effect border-emerald-300 text-emerald-700 hover:text-emerald-800 hover:border-emerald-400"
                 >
                  Join Waitlist
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  size="lg" 
                  className="hover-effect bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Footer />
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
