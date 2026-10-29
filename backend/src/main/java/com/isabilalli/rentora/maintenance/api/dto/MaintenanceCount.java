package com.isabilalli.rentora.maintenance.api.dto;

import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;

// How many requests have this status and this priority. The Maintenance page adds these up for each filter,
// so the status counts can follow the chosen priority and the other way round.
public record MaintenanceCount(
        MaintenanceStatus status,
        MaintenancePriority priority,
        long requests
) {
}
