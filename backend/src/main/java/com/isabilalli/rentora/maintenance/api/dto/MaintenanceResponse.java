package com.isabilalli.rentora.maintenance.api.dto;

import com.isabilalli.rentora.maintenance.domain.MaintenancePriority;
import com.isabilalli.rentora.maintenance.domain.MaintenanceRequest;
import com.isabilalli.rentora.maintenance.domain.MaintenanceStatus;

import java.time.OffsetDateTime;

public record MaintenanceResponse(
        Long id,
        Long organizationId,
        Long propertyId,
        Long spaceId,
        String title,
        String description,
        MaintenancePriority priority,
        MaintenanceStatus status,
        OffsetDateTime reportedAt,
        OffsetDateTime resolvedAt,
        Long reportedByUserId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static MaintenanceResponse from(
            MaintenanceRequest request
    ) {
        return new MaintenanceResponse(
                request.getId(),
                request.getOrganizationId(),
                request.getPropertyId(),
                request.getSpaceId(),
                request.getTitle(),
                request.getDescription(),
                request.getPriority(),
                request.getStatus(),
                request.getReportedAt(),
                request.getResolvedAt(),
                request.getReportedByUserId(),
                request.getCreatedAt(),
                request.getUpdatedAt()
        );
    }
}