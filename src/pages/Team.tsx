import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { TeamService } from "@/services/TeamService";
import { Profile, ProfileUpdate } from "@/lib/supabase/types";
import { TeamMemberTable } from "@/components/team/TeamMemberTable";
import { InviteMemberDialog } from "@/components/team/InviteMemberDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface TeamMember extends Profile {
  role?: string;
}

const Team = () => {
  const { getToken } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const navigate = useNavigate();

  const teamService = useMemo(() => {
    return new TeamService(getToken);
  }, [getToken]);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await teamService.getTeamMembers();
      if (fetchError) {
        const errorMessage =
          typeof fetchError === "string"
            ? fetchError
            : fetchError instanceof Error
              ? fetchError.message
              : "An unknown error occurred";
        setError(`Failed to load team members: ${errorMessage}`);
        toast.error(`Error loading team: ${errorMessage}`);
      } else if (data) {
        setTeamMembers(data as TeamMember[]);
      } else {
        setTeamMembers([]);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred.";
      setError(`Failed to load team members: ${errorMessage}`);
      toast.error(`Failed to load team members: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, [teamService]);

  const handleInvite = () => {
    setEditingMember(null);
    setIsInviteDialogOpen(true);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsInviteDialogOpen(true);
  };

  const handleSaveMember = async (
    memberData: Omit<ProfileUpdate, "id" | "user_id"> & { id?: string },
  ) => {
    setIsLoading(true);
    try {
      let result;
      if (editingMember && editingMember.id) {
        const updateData: ProfileUpdate = {
          id: editingMember.id,
          full_name: memberData.full_name,
          department: memberData.department,
        };
        result = await teamService.updateTeamMember(updateData);
        if (!result.error) {
          toast.success("Team member updated successfully!");
          setEditingMember(null);
        }
      } else {
        console.warn(
          "handleSaveMember called without an editingMember. Invite logic should be separate.",
        );
        toast.info(
          "To invite a new member, use the dedicated invite function.",
        );
        setIsLoading(false);
        return;
      }

      if (result && result.error) {
        const errorMessage = result.error.message || "Failed to save member.";
        toast.error(errorMessage);
      } else {
        setIsInviteDialogOpen(false);
        await fetchTeamMembers();
      }
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred.";
      toast.error(`Error saving member: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = (member: TeamMember) => {
    setMemberToDelete(member);
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;
    setIsLoading(true);

    try {
      const { error: deleteError } = await teamService.deleteTeamMember(
        memberToDelete.id,
      );
      if (deleteError) {
        const errorMessage = deleteError.message || "Failed to delete member.";
        toast.error(errorMessage);
      } else {
        toast.success("Team member deleted successfully!");
        await fetchTeamMembers();
      }
    } catch (error: any) {
      const errorMessage =
        error.message || "An unexpected error occurred during deletion.";
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setMemberToDelete(null);
      setIsLoading(false);
    }
  };

  const handleInviteSuccess = async () => {
    setIsInviteDialogOpen(false);
    toast.success("Invitation sent successfully!");
    await fetchTeamMembers();
  };

  const groupedMembers = teamMembers.reduce((acc, member) => {
    const department = member.department || 'Other';
    if (!acc[department]) {
      acc[department] = [];
    }
    acc[department].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="container mx-auto px-4 pt-24 pb-12 flex-grow">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <Button onClick={handleInvite} disabled={isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> Invite Member
          </Button>
        </div>

        {isLoading && teamMembers.length === 0 && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        )}
        {error && (
          <p className="text-red-500 text-center py-8">Error: {error}</p>
        )}
        {!error && (
          <TeamMemberTable
            members={teamMembers}
            onEdit={handleEdit}
            onDelete={handleDeleteConfirm}
            isLoading={isLoading}
          />
        )}
        {teamMembers.length === 0 && !isLoading && !error && (
          <p className="text-center text-gray-500 py-8">
            No team members found. Invite someone!
          </p>
        )}
      </main>
      <InviteMemberDialog
        key={editingMember ? editingMember.id : "invite"}
        isOpen={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onSave={handleSaveMember}
        onInviteSuccess={handleInviteSuccess}
        editingMember={editingMember}
        onClose={() => {
          setIsInviteDialogOpen(false);
          setEditingMember(null);
        }}
      />

      {memberToDelete && (
        <AlertDialog
          open={!!memberToDelete}
          onOpenChange={(open) => !open && setMemberToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                team member profile (
                {memberToDelete.full_name || memberToDelete.email}). Deleting
                the profile does not remove the user's login access immediately
                if they were invited via Clerk/Supabase Auth, but removes them
                from this team view.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setMemberToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90"
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Team;
