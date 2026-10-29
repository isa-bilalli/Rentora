import { apiRequest } from "../../../lib/api/client";
import type { PageResponse } from "../../../lib/api/page";
import type { SortState } from "../../../lib/sort";
import type {
    CreateTenantRequest,
    TenantResponse,
    TenantSortField,
    TenantType,
    UpdateTenantRequest,
} from "../types";

export interface TenantPageQuery {
    // Matched against the name, email, phone, type and number, ignoring case.
    search?: string;
    page: number;
    size: number;
    // Newest added first when left out.
    sort?: SortState<TenantSortField>;
}

// One page of the Tenants page, searched and sorted on the server.
export async function getTenantPage(organizationId: number, { search, page, size, sort }: TenantPageQuery): Promise<PageResponse<TenantResponse>> {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) query.set("search", search);
    if (sort) {
        query.set("sort", sort.key);
        query.set("direction", sort.direction.toUpperCase());
    }
    return apiRequest<PageResponse<TenantResponse>>(`/api/organizations/${organizationId}/tenants/page?${query}`, {
        authenticated: true,
    });
}

// How many individuals and companies there are, for the Tenants page's summary.
export async function getTenantSummary(organizationId: number): Promise<Record<TenantType, number>> {
    return apiRequest<Record<TenantType, number>>(`/api/organizations/${organizationId}/tenants/summary`, {
        authenticated: true,
    });
}

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
