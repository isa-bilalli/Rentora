export interface TenantResponse {
    id: number;
    organizationId: number;
    type: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
    updatedAt: string;
}

export function getTenantDisplayName(tenant: TenantResponse): string {
    const personName = [tenant.firstName, tenant.lastName]
        .filter((value): value is string => Boolean(value?.trim()))
        .join(" ");

    return personName || tenant.companyName?.trim() || `Tenant #${tenant.id}`;
}
