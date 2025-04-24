import { createAuthenticatedSupabaseClient } from "@/lib/supabase/client";
import { ITeamService } from "./interfaces/ITeamService";
import { Database } from "@/lib/supabase/types";
import { SupabaseClient } from '@supabase/supabase-js';

type DbProfile = Database['public']['Tables']['profiles']['Row'];
type GetTokenFn = (options?: { template?: string }) => Promise<string | null>;

export class TeamService implements ITeamService {
  private getToken: GetTokenFn;

  constructor(getToken: GetTokenFn) {
    if (!getToken) {
      throw new Error("TeamService requires a getToken function.");
    }
    this.getToken = getToken;
    console.log("TeamService initialized with getToken function.");
  }

  async getTeamMembers(): Promise<{ data: DbProfile[] | null; error: any }> {
    console.log("TeamService: getTeamMembers called.");
    let supabase: SupabaseClient<Database>;
    try {
      supabase = await createAuthenticatedSupabaseClient(this.getToken);
      console.log("TeamService: Authenticated Supabase client created for getTeamMembers.");
    } catch (error) {
      console.error("TeamService: Failed to create authenticated Supabase client:", error);
      return { data: null, error: new Error("Failed to authenticate for fetching team members.") };
    }

    console.log("TeamService: Fetching team members from Supabase...");
    const { data, error } = await supabase
      .from("profiles")
      .select("*");

    if (error) {
      console.error("TeamService: Error fetching team members:", error);
      return { data: null, error };
    }

    console.log("TeamService: Successfully fetched members:", data);
    return { data, error: null };
  }

  // Add other methods here (e.g., inviteMember, updateMemberRole)
} 