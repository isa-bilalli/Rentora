import { apiRequest } from "../../../lib/api/client";
import type { TenantResponse } from "../types";

export async function getTenants(organizationId: number): Promise<TenantResponse[]> {
    return apiRequest<TenantResponse[]>(`/api/organizations/${organizationId}/tenants`, {
            authenticated: true,
        },
    );
}
