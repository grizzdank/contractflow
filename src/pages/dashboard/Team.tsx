import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle, Mail, PhoneCall, MessageSquare } from "lucide-react";

const TEAM_MEMBERS = [
  {
    id: "1",
    name: "Alex Johnson",
    role: "Contract Administrator",
    email: "alex@example.com",
    phone: "+1 (555) 123-4567",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    status: "online",
    department: "Legal"
  },
  {
    id: "2",
    name: "Sam Williams",
    role: "Legal Counsel",
    email: "sam@example.com",
    phone: "+1 (555) 234-5678",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    status: "away",
    department: "Legal"
  },
  {
    id: "3",
    name: "Taylor Chen",
    role: "Procurement Manager",
    email: "taylor@example.com",
    phone: "+1 (555) 345-6789",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    status: "offline",
    department: "Procurement"
  },
  {
    id: "4",
    name: "Jordan Smith",
    role: "Finance Director",
    email: "jordan@example.com",
    phone: "+1 (555) 456-7890",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    status: "online",
    department: "Finance"
  },
  {
    id: "5",
    name: "Morgan Lee",
    role: "Operations Manager",
    email: "morgan@example.com",
    phone: "+1 (555) 567-8901",
    avatar: "https://randomuser.me/api/portraits/women/5.jpg",
    status: "online",
    department: "Operations"
  }
];

const Team = () => {
  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Team Members</h1>
            <p className="text-gray-500">Manage your team and permissions</p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEAM_MEMBERS.map((member) => (
            <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Badge 
                    variant={
                      member.status === "online" ? "default" : 
                      member.status === "away" ? "outline" : "secondary"
                    }
                    className="ml-auto"
                  >
                    {member.status === "online" ? "Online" : 
                     member.status === "away" ? "Away" : "Offline"}
                  </Badge>
                </div>
                <CardTitle className="mt-2">{member.name}</CardTitle>
                <CardDescription>{member.role}</CardDescription>
                <Badge variant="outline" className="mt-1">
                  {member.department}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{member.email}</span>
                  </div>
                  <div className="flex items-center">
                    <PhoneCall className="h-4 w-4 mr-2" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button size="sm" variant="outline" className="ml-2">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
};

export default Team;
