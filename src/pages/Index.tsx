
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GanttChartSquare, Users2, Bell, Calendar } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary p-6">
      <div className="max-w-7xl mx-auto space-y-8 fade-in">
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-block px-4 py-1 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            Welcome to ContractFlow
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Contract Management Made Simple
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Streamline your contract workflow with our intuitive platform designed for small businesses.
          </p>
        </header>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <QuickActionCard
            icon={<GanttChartSquare className="h-6 w-6" />}
            title="Contracts"
            description="Manage and track all your contracts in one place"
          />
          <QuickActionCard
            icon={<Users2 className="h-6 w-6" />}
            title="Team"
            description="Collaborate with your team members efficiently"
          />
          <QuickActionCard
            icon={<Bell className="h-6 w-6" />}
            title="Notifications"
            description="Stay updated with important contract deadlines"
          />
          <QuickActionCard
            icon={<Calendar className="h-6 w-6" />}
            title="Calendar"
            description="View upcoming contract events and deadlines"
          />
        </div>

        {/* Get Started Section */}
        <section className="glass-panel p-8 text-center space-y-6">
          <h2 className="text-2xl font-semibold">Ready to Get Started?</h2>
          <p className="text-muted-foreground">
            Join thousands of businesses managing their contracts efficiently.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="hover-effect">
              Sign Up Now
            </Button>
            <Button size="lg" variant="outline" className="hover-effect">
              Learn More
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

const QuickActionCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <Card className="p-6 hover-effect cursor-pointer glass-panel slide-up">
    <div className="space-y-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </Card>
);

export default Index;
