import { apiRequest } from "../../../lib/api/client";
import type {
    FinancialReportResponse,
    LeaseReportResponse,
    MaintenanceReportResponse,
    OccupancyReportResponse,
    ReportPeriodRequest,
} from "../types";

// Every report is a POST so the period can travel in the body; none of them change anything.
function postReport<T>(path: string, body: ReportPeriodRequest & { propertyId?: number }): Promise<T> {
    return apiRequest<T>(path, {
        method: "POST",
        body: JSON.stringify(body),
        authenticated: true,
    });
}

// Pass propertyId for one property's figures. That uses the property endpoint: the organization-wide one
// would apply propertyId to the expense breakdown only, not to the totals.
export async function getFinancialReport(
    organizationId: number,
    period: ReportPeriodRequest,
    propertyId?: number,
): Promise<FinancialReportResponse> {
    return propertyId === undefined
        ? postReport(`/api/organizations/${organizationId}/reports/financial`, period)
        : postReport(`/api/organizations/${organizationId}/reports/properties/${propertyId}/financial`, period);
}

export async function getOccupancyReport(
    organizationId: number,
    period: ReportPeriodRequest,
    propertyId?: number,
): Promise<OccupancyReportResponse> {
    return postReport(`/api/organizations/${organizationId}/reports/occupancy`, { ...period, propertyId });
}

export async function getLeaseReport(
    organizationId: number,
    period: ReportPeriodRequest,
    propertyId?: number,
): Promise<LeaseReportResponse> {
    return postReport(`/api/organizations/${organizationId}/reports/leases`, { ...period, propertyId });
}

export async function getMaintenanceReport(
    organizationId: number,
    period: ReportPeriodRequest,
    propertyId?: number,
): Promise<MaintenanceReportResponse> {
    return postReport(`/api/organizations/${organizationId}/reports/maintenance`, { ...period, propertyId });
}
