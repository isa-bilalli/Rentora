import type { StatusBadgeTone } from "../../components/ui/StatusBadge";
import type { MaintenancePriority, MaintenanceStatus } from "./types";

export const MAINTENANCE_STATUSES: MaintenanceStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"];

// Most urgent first.
export const MAINTENANCE_PRIORITIES: MaintenancePriority[] = ["URGENT", "HIGH", "MEDIUM", "LOW"];

export const maintenanceStatusLabel: Record<MaintenanceStatus, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    RESOLVED: "Resolved",
    CANCELLED: "Cancelled",
};

export const maintenancePriorityLabel: Record<MaintenancePriority, string> = {
    URGENT: "Urgent",
    HIGH: "High",
    MEDIUM: "Medium",
    LOW: "Low",
};

// Same colors as the maintenance badges on the property details page.
export const maintenanceStatusTone: Record<MaintenanceStatus, StatusBadgeTone> = {
    OPEN: "warning",
    IN_PROGRESS: "info",
    RESOLVED: "success",
    CANCELLED: "neutral",
};

export const maintenancePriorityTone: Record<MaintenancePriority, StatusBadgeTone> = {
    URGENT: "danger",
    HIGH: "warning",
    MEDIUM: "info",
    LOW: "neutral",
};

// Open and in-progress requests still need someone to act on them.
export function isMaintenanceActive(status: MaintenanceStatus): boolean {
    return status === "OPEN" || status === "IN_PROGRESS";
}
