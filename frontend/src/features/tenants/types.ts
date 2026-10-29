export type TenantType = "INDIVIDUAL" | "COMPANY";

// The Tenants page's sortable columns, as the server names them.
export type TenantSortField = "ADDED";

export interface TenantResponse {
    id: number;
    organizationId: number;
    type: TenantType;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTenantRequest {
    type: TenantType;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string | null;
    phone: string | null;
}

export type UpdateTenantRequest = CreateTenantRequest;

export function getTenantDisplayName(tenant: TenantResponse): string {
    const personName = [tenant.firstName, tenant.lastName]
        .filter((value): value is string => Boolean(value?.trim()))
        .join(" ");

    return personName || tenant.companyName?.trim() || `Tenant #${tenant.id}`;
}
