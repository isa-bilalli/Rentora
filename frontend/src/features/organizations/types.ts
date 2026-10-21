// From most to least access; see docs/ROLES.md.
export type OrganizationRole = "OWNER" | "MANAGER" | "MEMBER";

export interface Organization {
    id: number;
    name: string;
    // The current user's role in this organization.
    role: OrganizationRole;
    createdAt?: string;
    updatedAt?: string;
}

export interface OrganizationMember {
    userId: number;
    firstName: string;
    lastName: string;
    email: string;
    role: OrganizationRole;
    joinedAt: string;
}

export interface AddMemberRequest {
    // The email of an existing Rentora account.
    email: string;
    // Nobody can be added as an owner.
    role: Exclude<OrganizationRole, "OWNER">;
}
