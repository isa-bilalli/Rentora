import { apiRequest } from "../../../lib/api/client"
import { listFilterQuery, type ListFilter } from "../../../lib/api/listFilter";
import type { CreateLeaseRequest, LeaseResponse, RenewLeaseRequest } from "../types";

// Every lease in the organization, or only one property's or one tenant's.
export async function getLeases(organizationId: number, filter?: ListFilter): Promise<LeaseResponse[]> {
    return apiRequest<LeaseResponse[]>(`/api/organizations/${organizationId}/leases${listFilterQuery(filter)}`, {
            authenticated: true,
        },
    );
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