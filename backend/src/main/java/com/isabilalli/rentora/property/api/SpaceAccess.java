package com.isabilalli.rentora.property.api;

public interface SpaceAccess {
    void requireBelongsToOrganization(Long spaceId, Long organizationId);
    void markOccupied(Long spaceId);
    void markVacant(Long spaceId);
    void markReserved(Long spaceId);
    void markMaintenance(Long spaceId);
    void prepareForFutureLease(Long spaceId);
    void requireBelongsToProperty(Long spaceId, Long propertyId);
}
