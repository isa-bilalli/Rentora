import { apiRequest } from "../../../lib/api/client"
import { listFilterQuery, type ListFilter } from "../../../lib/api/listFilter";
import type { PageResponse } from "../../../lib/api/page";
import type { SortState } from "../../../lib/sort";
import type { LeaseDisplayStatus } from "../status";
import type { CreateLeaseRequest, LeaseListItem, LeaseResponse, LeaseSortField, RenewLeaseRequest } from "../types";

// Every lease in the organization, or only one property's or one tenant's.
export async function getLeases(organizationId: number, filter?: ListFilter): Promise<LeaseResponse[]> {
    return apiRequest<LeaseResponse[]>(`/api/organizations/${organizationId}/leases${listFilterQuery(filter)}`, {
            authenticated: true,
        },
    );
}

export interface LeasePageQuery {
    // Every status when left out.
    status?: LeaseDisplayStatus;
    // Matched against the tenant's name, the property and the space, ignoring case.
    search?: string;
    page: number;
    size: number;
    // Newest start first when left out.
    sort?: SortState<LeaseSortField>;
}

// One page of the Leases page, filtered, searched and sorted on the server.
export async function getLeasePage(organizationId: number, { status, search, page, size, sort }: LeasePageQuery): Promise<PageResponse<LeaseListItem>> {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set("status", status);
    if (search) query.set("search", search);
    if (sort) {
        query.set("sort", sort.key);
        query.set("direction", sort.direction.toUpperCase());
    }
    return apiRequest<PageResponse<LeaseListItem>>(`/api/organizations/${organizationId}/leases/page?${query}`, {
        authenticated: true,
    });
}

// How many leases each status has, for the Leases page's filters.
export async function getLeaseSummary(organizationId: number): Promise<Record<LeaseDisplayStatus, number>> {
    return apiRequest<Record<LeaseDisplayStatus, number>>(`/api/organizations/${organizationId}/leases/summary`, {
        authenticated: true,
    });
}

export async function getLease(organizationId: number, leaseId: number): Promise<LeaseResponse> {
    return apiRequest<LeaseResponse>(`/api/organizations/${organizationId}/leases/${leaseId}`, {
        authenticated: true,
    });
}

export async function createLease(organizationId: number, request: CreateLeaseRequest): Promise<LeaseResponse> {
    return apiRequest<LeaseResponse>(`/api/organizations/${organizationId}/leases`, {
            method: "POST",
            body: JSON.stringify(request),
            authenticated: true,
        },
    );
}

export async function endLease(organizationId: number, leaseId: number): Promise<LeaseResponse> {
    return apiRequest<LeaseResponse>(`/api/organizations/${organizationId}/leases/${leaseId}/end`, {
            method: "POST",
            authenticated: true,
        },
    );
}

export async function cancelLease(organizationId: number, leaseId: number): Promise<LeaseResponse> {
    return apiRequest<LeaseResponse>(`/api/organizations/${organizationId}/leases/${leaseId}/cancel`, {
            method: "POST",
            authenticated: true,
        },
    );
}

export async function renewLease(organizationId: number, leaseId: number, request: RenewLeaseRequest): Promise<LeaseResponse> {
    return apiRequest<LeaseResponse>(`/api/organizations/${organizationId}/leases/${leaseId}/renew`, {
            method: "POST",
            body: JSON.stringify(request),
            authenticated: true,
        },
    );
}