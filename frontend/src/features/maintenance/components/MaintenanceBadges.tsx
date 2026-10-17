import StatusBadge from "../../../components/ui/StatusBadge";
import {
    maintenancePriorityLabel,
    maintenancePriorityTone,
    maintenanceStatusLabel,
    maintenanceStatusTone,
} from "../status";
import type { MaintenancePriority, MaintenanceStatus } from "../types";

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
    return (
        <StatusBadge tone={maintenanceStatusTone[status]}>
            {maintenanceStatusLabel[status]}
        </StatusBadge>
    );
}

export function MaintenancePriorityBadge({ priority }: { priority: MaintenancePriority }) {
    return (
        <StatusBadge tone={maintenancePriorityTone[priority]}>
            {maintenancePriorityLabel[priority]}
        </StatusBadge>
    );
}
