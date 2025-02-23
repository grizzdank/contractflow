
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Users } from "lucide-react";

// Example team data - you can replace this with real data later
const teamMembers = [
  {
    name: "Sarah Johnson",
    role: "CEO",
    department: "Executive",
    bio: "Visionary leader with 15+ years of experience in technology and innovation.",
  },
  {
    name: "Michael Chen",
    role: "CTO",
    department: "Engineering",
    bio: "Passionate about building scalable solutions and fostering technical excellence.",
  },
  {
    name: "Emma Rodriguez",
    role: "Head of Design",
    department: "Design",
    bio: "Creative director specializing in user-centered design and brand identity.",
  },
];

const Team = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Our Team</h1>
          </div>
          
          <p className="text-muted-foreground mb-12">
            Meet the talented individuals who make our success possible.
          </p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teamMembers.map((member) => (
              <Card key={member.name} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle>{member.name}</CardTitle>
                  <CardDescription>{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-primary mb-2">
                    {member.department}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.bio}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Team;
