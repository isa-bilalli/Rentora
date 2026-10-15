export type MaintenanceStatus = | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
export type MaintenancePriority = | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface MaintenanceResponse {
    id: number,
    organizationId: number,
    propertyId: number,
    spaceId: number,
    title: string,
    description: string,
    priority: MaintenancePriority,
    status: MaintenanceStatus
    reportedAt: string,
    resolvedAt: string,
    reportedByUserId: number,
    createdAt: string,
    updatedAt: string,
}

export interface CreateMaintenanceRequest {
    propertyId: number,
    spaceId: number,
    title: string,
    description: string,
    priority: MaintenancePriority,
}

export interface UpdateMaintenanceRequest {
    title: string,
    description: string,
    priority: MaintenancePriority,
}
