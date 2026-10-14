import { apiRequest } from "../../../lib/api/client"
import type { CreateLeaseRequest, LeaseResponse, RenewLeaseRequest } from "../types";

export async function getLeases(organizationId: number): Promise<LeaseResponse[]> {
    return apiRequest<LeaseResponse[]>(`/api/organizations/${organizationId}/leases`, {
            authenticated: true,
        },
    );
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