package com.isabilalli.rentora.property.api.dto;

import com.isabilalli.rentora.property.domain.Property;

import java.time.OffsetDateTime;

public record PropertyResponse(
        Long id,
        Long organizationId,
        String name,
        String addressLine,
        String city,
        String postalCode,
        String country,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static PropertyResponse from(Property property) {
        return new PropertyResponse(
                property.getId(),
                property.getOrganizationId(),
                property.getName(),
                property.getAddressLine(),
                property.getCity(),
                property.getPostalCode(),
                property.getCountry(),
                property.getCreatedAt(),
                property.getUpdatedAt()
        );
    }
}