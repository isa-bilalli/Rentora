import { apiRequest } from "../../../lib/api/client";
import type {
    CreateTenantRequest,
    TenantResponse,
    UpdateTenantRequest,
} from "../types";

export async function getTenants(
    organizationId: number,
): Promise<TenantResponse[]> {
    return apiRequest<TenantResponse[]>(
        `/api/organizations/${organizationId}/tenants`,
        { authenticated: true },
    );
}

export async function getTenant(
    organizationId: number,
    tenantId: number,
): Promise<TenantResponse> {
    return apiRequest<TenantResponse>(
        `/api/organizations/${organizationId}/tenants/${tenantId}`,
        { authenticated: true },
    );
}

export async function createTenant(
    organizationId: number,
    request: CreateTenantRequest,
): Promise<TenantResponse> {
    return apiRequest<TenantResponse>(
        `/api/organizations/${organizationId}/tenants`,
        {
            method: "POST",
            body: JSON.stringify(request),
            authenticated: true,
        },
    );
}

export async function updateTenant(
    organizationId: number,
    tenantId: number,
    request: UpdateTenantRequest,
): Promise<TenantResponse> {
    return apiRequest<TenantResponse>(
        `/api/organizations/${organizationId}/tenants/${tenantId}`,
        {
            method: "PATCH",
            body: JSON.stringify(request),
            authenticated: true,
        },
    );
}
