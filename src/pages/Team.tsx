import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

type TeamMember = {
  id: string;
  full_name: string | null;
  email: string;
  department: string | null;
};

const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userDepartment, setUserDepartment] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        // Temporarily bypass session check for development
        const { data: fakeUserData } = await supabase
          .from('profiles')
          .select('*')
          .limit(1)
          .single();

        // Set a default department for development
        setUserDepartment(fakeUserData?.department || 'Engineering');

        // Fetch team members from the same department and Operations
        const { data: members, error: membersError } = await supabase
          .from('profiles')
          .select('*')
          .in('department', [fakeUserData?.department || 'Engineering', 'Operations']);

        if (membersError) throw membersError;

        setTeamMembers(members || []);

      } catch (error: any) {
        console.error('Error:', error);
        toast({
          title: "Error fetching team members",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchTeamMembers();
  }, [toast]);

  // Group team members by department
  const groupedMembers = teamMembers.reduce((acc, member) => {
    const department = member.department || 'Other';
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Your Team</h1>
          </div>
          
          <p className="text-muted-foreground mb-12">
            Viewing team members from your department{userDepartment ? ` (${userDepartment})` : ''} and Operations
          </p>

          {Object.entries(groupedMembers).map(([department, members]) => (
            <div key={department} className="mb-12">
              <h2 className="text-xl font-semibold mb-6 text-primary">{department}</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {members.map((member) => (
                  <Card key={member.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>{member.full_name || 'Unnamed Member'}</CardTitle>
                      <CardDescription>{member.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium text-primary">
                        {member.department}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {Object.keys(groupedMembers).length === 0 && (
            <div className="text-center text-gray-500 py-12">
              No team members found in your department or Operations.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Team;
