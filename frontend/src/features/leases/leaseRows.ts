import { getLeases } from "./api/leasesApi";
import { getTenants } from "../tenants/api/tenantApi";
import { getTenantDisplayName } from "../tenants/types";
import { loadPropertyDirectory } from "../properties/propertyDirectory";
import type { LeaseResponse } from "./types";
import { getLeaseDisplayStatus, type LeaseDisplayStatus } from "./status";
import { todayLocalDateString } from "../../lib/dates";

export interface LeaseRow {
    lease: LeaseResponse;
    status: LeaseDisplayStatus;
    tenantName: string;
    propertyName: string;
    spaceName: string;
}

// Leases only carry tenant and space IDs, so this also loads tenants, properties and spaces to show names.
export async function loadLeaseRows(organizationId: number): Promise<LeaseRow[]> {
    const [leases, tenants, { propertyById, spaceById }] = await Promise.all([
        getLeases(organizationId),
        getTenants(organizationId),
        loadPropertyDirectory(organizationId),
    ]);

    const tenantById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
    const today = todayLocalDateString();

    return leases
        .map((lease) => {
            const tenant = tenantById.get(lease.tenantId);
            const space = spaceById.get(lease.spaceId);
            const property = space ? propertyById.get(space.propertyId) : undefined;
            return {
                lease,
                status: getLeaseDisplayStatus(lease, today),
                tenantName: tenant ? getTenantDisplayName(tenant) : `Tenant #${lease.tenantId}`,
                propertyName: property?.name ?? "Unknown property",
                spaceName: space?.name ?? `Space #${lease.spaceId}`,
            };
        })
        // Newest first: upcoming leases, then the most recently started.
        .sort((a, b) => b.lease.startDate.localeCompare(a.lease.startDate));
}
