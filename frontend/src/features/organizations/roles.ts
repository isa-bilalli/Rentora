import type { StatusBadgeTone } from "../../components/ui/StatusBadge";
import type { OrganizationRole } from "./types";

const ORDER: OrganizationRole[] = ["OWNER", "MANAGER", "MEMBER"];

// Same rule as the backend's OrganizationRole.isAtLeast: an owner may do everything a manager may.
export function isAtLeast(role: OrganizationRole, minimum: OrganizationRole): boolean {
    return ORDER.indexOf(role) <= ORDER.indexOf(minimum);
}

export const ROLE_LABELS: Record<OrganizationRole, string> = {
    OWNER: "Owner",
    MANAGER: "Manager",
    MEMBER: "Member",
};

export const ROLE_TONES: Record<OrganizationRole, StatusBadgeTone> = {
    OWNER: "brand",
    MANAGER: "info",
    MEMBER: "neutral",
};
