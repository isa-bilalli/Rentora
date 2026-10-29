export type MaintenanceStatus = | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED";
export type MaintenancePriority = | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

// One row of the Maintenance page, with the names shown beside the request. spaceName is null for a request
// about the whole property.
export interface MaintenanceListItem {
    request: MaintenanceResponse;
    propertyName: string;
    spaceName: string | null;
}

// How many requests have this status and this priority.
export interface MaintenanceCount {
    status: MaintenanceStatus;
    priority: MaintenancePriority;
    requests: number;
}

// The Maintenance page's sortable columns, as the server names them.
export type MaintenanceSortField = "REPORTED" | "RESOLVED";

export interface MaintenanceResponse {
    id: number,
    organizationId: number,
    propertyId: number,
    // null when the request is about the whole property rather than one space.
    spaceId: number | null,
    title: string,
    description: string | null,
    priority: MaintenancePriority,
    status: MaintenanceStatus
    reportedAt: string,
    resolvedAt: string | null,
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
