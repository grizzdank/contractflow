import { UserRole } from "@/domain/types/Auth"; // Assuming DB roles align with UserRole enum

/**
 * Maps Clerk organization roles (like 'org_admin') to internal database roles.
 * 
 * @param clerkRole The role string received from Clerk.
 * @returns The corresponding internal database role (e.g., 'admin', 'manager'). Defaults to 'viewer'.
 */
export function mapClerkRoleToDbRole(clerkRole: string): UserRole {
  switch (clerkRole?.toLowerCase()) {
    case 'org_admin':
      return UserRole.ADMINISTRATOR; // Maps to 'Administrator'
    case 'org_manager':
      return UserRole.MANAGER;     // Maps to 'Manager'
    case 'org_reviewer':
      return UserRole.REVIEWER;    // Maps to 'Reviewer'
    case 'org_contributor':
      return UserRole.CONTRIBUTOR; // Maps to 'Contributor'
    case 'org_member': // Default Clerk role if no specific one assigned
    case 'basic_member': // Explicitly handle basic_member if Clerk uses it
    default:
      return UserRole.VIEWER;      // Maps to 'Viewer'
  }
}

// If needed later, add mapDatabaseRoleToUserRole here, or keep separate if logic differs significantly.
// export function mapDatabaseRoleToUserRole(dbRole: UserRole): string { ... } 