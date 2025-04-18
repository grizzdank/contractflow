import { Database } from "@/lib/supabase/types";

// Using DbProfile for now, might need a dedicated TeamMember type later
type DbProfile = Database['public']['Tables']['profiles']['Row'];

export interface ITeamService {
  getTeamMembers(): Promise<{ data: DbProfile[] | null; error: any }>;
  // Add other team/member related methods here (e.g., inviteMember, updateMemberRole)
} 