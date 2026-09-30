package com.isabilalli.rentora.property.api;

public interface PropertyAccess {
    void requireBelongsToOrganization(Long propertyId, Long organizationId);
    Long countByOrganizationId(Long organizationId);
}
