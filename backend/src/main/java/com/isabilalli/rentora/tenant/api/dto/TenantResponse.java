package com.isabilalli.rentora.tenant.api.dto;

import com.isabilalli.rentora.tenant.domain.Tenant;
import com.isabilalli.rentora.tenant.domain.TenantType;

import java.time.OffsetDateTime;

public record TenantResponse(
        Long id,
        Long organizationId,
        TenantType type,
        String firstName,
        String lastName,
        String companyName,
        String email,
        String phone,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static TenantResponse from(Tenant tenant) {
        return new TenantResponse(
                tenant.getId(),
                tenant.getOrganizationId(),
                tenant.getType(),
                tenant.getFirstName(),
                tenant.getLastName(),
                tenant.getCompanyName(),
                tenant.getEmail(),
                tenant.getPhone(),
                tenant.getCreatedAt(),
                tenant.getUpdatedAt()
        );
    }
}