package com.isabilalli.rentora.lease.api.dto;

public record CurrentSpaceRentSummary(
        Long spaceId,
        Long monthlyRentCents
) {
}