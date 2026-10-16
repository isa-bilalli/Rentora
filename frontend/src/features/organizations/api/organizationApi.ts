import { apiRequest } from "../../../lib/api/client";
import type { Organization } from "../types";

/** Returns the organizations the currently authenticated user belongs to. */
export async function getMyOrganizations(): Promise<Organization[]> {
    return apiRequest<Organization[]>("/api/organizations/mine", {
        authenticated: true,
    });
}
