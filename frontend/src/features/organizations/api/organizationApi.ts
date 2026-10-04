import { apiRequest } from "../../../lib/api/client";
import type { Organization } from "../types";

export async function getMyOrganizations(): Promise<Organization[]> {
    return apiRequest<Organization[]>(
        "/api/organizations/mine",
        {
            method: "GET",
            authenticated: true,
        },
    );
}