package com.isabilalli.rentora.maintenance.api.dto;

import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import jakarta.validation.constraints.Size;

public record UpdateMaintenanceRequest(

        @Size(max = 200)
        String title,

        @Size(max = 1000)
        String description,

        MaintenancePriority priority
) {}