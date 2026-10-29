package com.isabilalli.rentora.maintenance.infrastructure;

import com.isabilalli.rentora.maintenance.domain.MaintenanceRequest;

// A request with the names the Maintenance page shows beside it, as MaintenanceRepository.findListPage reads them.
public record MaintenanceListRow(
        MaintenanceRequest request,
        String propertyName,
        String spaceName
) {
}
