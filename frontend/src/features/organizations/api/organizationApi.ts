import { apiRequest } from "../../../lib/api/client";
import type { AddMemberRequest, Organization, OrganizationMember } from "../types";

/** Returns the organizations the currently authenticated user belongs to. */
export async function getMyOrganizations(): Promise<Organization[]> {
    return apiRequest<Organization[]>("/api/organizations/mine", {
        authenticated: true,
    });
}

// Everyone in the organization, oldest member first.
export async function getMembers(organizationId: number): Promise<OrganizationMember[]> {
    return apiRequest<OrganizationMember[]>(`/api/organizations/${organizationId}/members`, {
        authenticated: true,
    });
}

// Gives an existing Rentora account access straight away. Owners and managers only.
export async function addMember(organizationId: number, request: AddMemberRequest): Promise<OrganizationMember> {
    return apiRequest<OrganizationMember>(`/api/organizations/${organizationId}/members`, {
        method: "POST",
        body: JSON.stringify(request),
        authenticated: true,
    });
}
