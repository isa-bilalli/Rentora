import type { LeaseDisplayStatus } from "./status";

export type LeaseStatus = "ACTIVE" | "ENDED" | "CANCELLED";

// One row of the Leases page, with the names shown beside the lease.
export interface LeaseListItem {
    lease: LeaseResponse;
    status: LeaseDisplayStatus;
    tenantName: string;
    propertyId: number;
    propertyName: string;
    spaceName: string;
}

// The Leases page's sortable columns, as the server names them.
export type LeaseSortField = "START_DATE" | "RENT";

export interface LeaseResponse {
    id: number;
    organizationId: number;
    tenantId: number;
    spaceId: number;
    startDate: string;
    endDate: string;
    monthlyRentCents: number;
    securityDepositCents: number;
    status: LeaseStatus;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLeaseRequest {
    tenantId: number;
    spaceId: number;
    startDate: string;
    endDate: string;
    monthlyRentCents: number;
    securityDepositCents: number;
}

export interface RenewLeaseRequest {
    startDate: string;
    endDate: string;
    monthlyRentCents: number;
    securityDepositCents: number;
}