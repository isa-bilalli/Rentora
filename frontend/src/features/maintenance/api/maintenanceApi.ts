import { apiRequest } from "../../../lib/api/client";
import type { CreateMaintenanceRequest, MaintenancePriority, MaintenanceResponse, MaintenanceStatus, UpdateMaintenanceRequest } from "../types";

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