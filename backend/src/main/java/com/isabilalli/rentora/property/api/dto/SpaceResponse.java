package com.isabilalli.rentora.property.api.dto;

import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public record SpaceResponse(
        Long id,
        Long propertyId,
        String name,
        SpaceType type,
        Integer floor,
        BigDecimal area,
        SpaceStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static SpaceResponse from(Space space) {
        return new SpaceResponse(
                space.getId(),
                space.getPropertyId(),
                space.getName(),
                space.getType(),
                space.getFloor(),
                space.getArea(),
                space.getStatus(),
                space.getCreatedAt(),
                space.getUpdatedAt()
        );
    }
}