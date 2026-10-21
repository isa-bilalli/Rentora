// Narrows an organization-wide list (leases, payments) to one property or one tenant.
export type ListFilter = { propertyId: number } | { tenantId: number };

// "?propertyId=4", "?tenantId=7", or nothing for the whole organization.
export function listFilterQuery(filter?: ListFilter): string {
    if (!filter) return "";
    return "propertyId" in filter ? `?propertyId=${filter.propertyId}` : `?tenantId=${filter.tenantId}`;
}
