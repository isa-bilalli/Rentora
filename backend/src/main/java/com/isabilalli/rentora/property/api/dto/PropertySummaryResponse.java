package com.isabilalli.rentora.property.api.dto;

public record PropertySummaryResponse(
        Long id,
        String name,
        String addressLine,
        String city,
        String postalCode,
        String country,

        String propertyType,

        long totalSpaces,
        long occupiedSpaces,
        long reservedSpaces,
        long vacantSpaces,
        long maintenanceSpaces,

        long monthlyExpectedRentCents
) {
}