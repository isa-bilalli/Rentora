package com.isabilalli.rentora.property.api;

import com.isabilalli.rentora.property.domain.SpaceStatus;

public interface SpaceAccess {
    void requireBelongsToOrganization(Long spaceId, Long organizationId);
    void markOccupied(Long spaceId);
    void markVacant(Long spaceId);
    void markReserved(Long spaceId);
    void markMaintenance(Long spaceId);
    void prepareForFutureLease(Long spaceId);
    void requireBelongsToProperty(Long spaceId, Long propertyId);
    Long countByOrganizationIdAndStatus(Long organizationId, SpaceStatus status);
    Long countByOrganizationId(Long organizationId);
}
