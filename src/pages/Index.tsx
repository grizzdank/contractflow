
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GanttChartSquare, Users2, Bell, Calendar } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8 fade-in">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-block px-4 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-sm font-medium mb-4">
            Welcome to ContractFlow
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
            Contract Management Made Simple
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Streamline your contract workflow with our intuitive platform designed for small businesses.
          </p>
        </header>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            icon={<GanttChartSquare className="h-6 w-6" />}
            title="Contracts"
            description="Manage and track all your contracts in one place"
            gradientClass="from-emerald-500 to-green-500"
          />
          <QuickActionCard
            icon={<Users2 className="h-6 w-6" />}
            title="Team"
            description="Collaborate with your team members efficiently"
            gradientClass="from-green-500 to-teal-500"
          />
          <QuickActionCard
            icon={<Bell className="h-6 w-6" />}
            title="Notifications"
            description="Stay updated with important contract deadlines"
            gradientClass="from-teal-500 to-orange-400"
          />
          <QuickActionCard
            icon={<Calendar className="h-6 w-6" />}
            title="Calendar"
            description="View upcoming contract events and deadlines"
            gradientClass="from-orange-400 to-orange-500"
          />
        </div>

        {/* Get Started Section */}
        <section className="glass-panel p-8 text-center space-y-6 bg-gradient-to-r from-green-50 to-orange-50">
          <h2 className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 to-orange-600 bg-clip-text text-transparent">
            Ready to Get Started?
          </h2>
          <p className="text-gray-600">
            Join thousands of businesses managing their contracts efficiently.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="hover-effect bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
              Sign Up Now
            </Button>
            <Button size="lg" variant="outline" className="hover-effect border-emerald-300 text-emerald-700 hover:text-emerald-800 hover:border-emerald-400">
              Learn More
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

const QuickActionCard = ({ 
  icon, 
  title, 
  description, 
  gradientClass 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradientClass: string;
}) => (
  <Card className="p-6 hover-effect cursor-pointer glass-panel slide-up border-0 shadow-lg bg-white/50">
    <div className="space-y-4">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${gradientClass} text-white`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </Card>
);

export default Index;
