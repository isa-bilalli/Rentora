export type LeaseStatus = "ACTIVE" | "ENDED" | "CANCELLED";

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