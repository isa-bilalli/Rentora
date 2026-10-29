import { apiRequest } from "../../../lib/api/client";
import type { PageResponse } from "../../../lib/api/page";
import type { SortState } from "../../../lib/sort";
import type {
    CreateMaintenanceRequest,
    MaintenanceCount,
    MaintenanceListItem,
    MaintenancePriority,
    MaintenanceResponse,
    MaintenanceSortField,
    MaintenanceStatus,
    UpdateMaintenanceRequest,
} from "../types";

export interface MaintenancePageQuery {
    // Every status or priority when left out.
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
    page: number;
    size: number;
    // What needs attention first when left out.
    sort?: SortState<MaintenanceSortField>;
}

// One page of the Maintenance page, filtered and sorted on the server.
export async function getMaintenancePage(organizationId: number, { status, priority, page, size, sort }: MaintenancePageQuery): Promise<PageResponse<MaintenanceListItem>> {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (status) query.set("status", status);
    if (priority) query.set("priority", priority);
    if (sort) {
        query.set("sort", sort.key);
        query.set("direction", sort.direction.toUpperCase());
    }
    return apiRequest<PageResponse<MaintenanceListItem>>(`/api/organizations/${organizationId}/maintenance/page?${query}`, {
        authenticated: true,
    });
}

// How many requests have each status and priority, for the Maintenance page's filters.
export async function getMaintenanceSummary(organizationId: number): Promise<MaintenanceCount[]> {
    return apiRequest<MaintenanceCount[]>(`/api/organizations/${organizationId}/maintenance/summary`, {
        authenticated: true,
    });
}

export async function createMaintenanceRequest(organizationId: number ,request: CreateMaintenanceRequest): Promise<MaintenanceResponse> {
    return apiRequest<MaintenanceResponse>(`/api/organizations/${organizationId}/maintenance`,{
        method: "POST",
        body: JSON.stringify(request),
        authenticated: true,
    })
}

export async function startProgress(organizationId: number, maintenanceId: number): Promise<MaintenanceResponse>{
    return apiRequest<MaintenanceResponse>(`/api/organizations/${organizationId}/maintenance/${maintenanceId}/start`,{
        method: "POST",
        authenticated: true,
    })
}

export async function resolveMaintenance(organizationId: number, maintenanceId: number): Promise<MaintenanceResponse> {
    return apiRequest<MaintenanceResponse>(`/api/organizations/${organizationId}/maintenance/${maintenanceId}/resolve`,{
        method: "POST",
        authenticated: true,
    })
}

export async function cancelMaintenance(organizationId: number, maintenanceId: number): Promise<MaintenanceResponse> {
    return apiRequest<MaintenanceResponse>(`/api/organizations/${organizationId}/maintenance/${maintenanceId}/cancel`,{
        method: "POST",
        authenticated: true,
    })
}

export async function getAllMaintenanceRequests(organizationId: number): Promise<MaintenanceResponse[]> {
    return apiRequest<MaintenanceResponse[]>(`/api/organizations/${organizationId}/maintenance`, {
        method: "GET",
        authenticated: true,
    })
}

export async function getMaintenanceByProperty(organizationId: number, propertyId: number): Promise<MaintenanceResponse[]> {
    return apiRequest<MaintenanceResponse[]>(`/api/organizations/${organizationId}/maintenance/properties/${propertyId}`, {
        method: "GET",
        authenticated: true,
    });
}

export async function getMaintenanceByPropertySpace(organizationId: number, propertyId: number, spaceId: number): Promise<MaintenanceResponse[]> {
    return apiRequest<MaintenanceResponse[]>(`/api/organizations/${organizationId}/maintenance/properties/${propertyId}/spaces/${spaceId}`, {
        method: "GET",
        authenticated: true,
    });
}

export async function getMaintenanceRequest(organizationId: number, maintenanceId: number): Promise<MaintenanceResponse> {
    return apiRequest<MaintenanceResponse>(`/api/organizations/${organizationId}/maintenance/${maintenanceId}`,{
        method: "GET",
        authenticated: true,
    })
}

export async function getMaintenanceByStatus(organizationId: number, status: MaintenanceStatus): Promise<MaintenanceResponse[]> {
    const params = new URLSearchParams({ status });
    return apiRequest<MaintenanceResponse[]>(`/api/organizations/${organizationId}/maintenance/status?${params.toString()}`, {
        method: "GET",
        authenticated: true,
    })
}

export async function getMaintenanceByPriority(organizationId: number, priority: MaintenancePriority): Promise<MaintenanceResponse[]> {
    const params = new URLSearchParams({ priority });
    return apiRequest<MaintenanceResponse[]>(`/api/organizations/${organizationId}/maintenance/priority?${params.toString()}`, {
        method: "GET",
        authenticated: true,
    })
}

export async function updateMaintenanceRequest(organizationId: number, maintenanceId: number, request: UpdateMaintenanceRequest): Promise<MaintenanceResponse> {
    return apiRequest<MaintenanceResponse>(`/api/organizations/${organizationId}/maintenance/${maintenanceId}`, {
        method: "PATCH",
        body: JSON.stringify(request),
        authenticated: true,
    })
}