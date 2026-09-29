package com.isabilalli.rentora.maintenance.api.dto;

import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateMaintenanceRequest(

        @NotNull
        Long propertyId,

        Long spaceId,

        @NotBlank
        @Size(max = 200)
        String title,

        @Size(max = 1000)
        String description,

        @NotNull
        MaintenancePriority priority
) {}