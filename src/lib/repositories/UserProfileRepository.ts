import { supabase } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/types";

// Define types used within the repository
type DbProfile = Database['public']['Tables']['profiles']['Row'];

export const UserProfileRepository = {
  async getAllProfiles(supabaseClient: typeof supabase): Promise<{ data: DbProfile[] | null; error: any }> {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .order('full_name');
      
    return { data, error };
  },
  
  // Add other profile-related methods here if needed (e.g., getProfileById, updateProfile)
}; 