package com.isabilalli.rentora.lease.api.dto;

import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.domain.LeaseStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record LeaseResponse(
        Long id,
        Long organizationId,
        Long tenantId,
        Long spaceId,
        LocalDate startDate,
        LocalDate endDate,
        Long monthlyRentCents,
        Long securityDepositCents,
        LeaseStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static LeaseResponse from(Lease lease) {
        return new LeaseResponse(
                lease.getId(),
                lease.getOrganizationId(),
                lease.getTenantId(),
                lease.getSpaceId(),
                lease.getStartDate(),
                lease.getEndDate(),
                lease.getMonthlyRentCents(),
                lease.getSecurityDepositCents(),
                lease.getStatus(),
                lease.getCreatedAt(),
                lease.getUpdatedAt()
        );
    }
}