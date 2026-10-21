import { isAtLeast } from "./roles";
import { useOrganization } from "./useOrganization";

// What the current user's role in the active organization lets them do. The backend checks the same
// rules (docs/ROLES.md); this only decides which buttons to show.
export function useRolePermissions() {
    const { activeOrganization } = useOrganization();
    const role = activeOrganization?.role;

    return {
        role,
        // Delete, void, end and cancel, and adding people: managers and owners.
        canManage: role !== undefined && isAtLeast(role, "MANAGER"),
    };
}
