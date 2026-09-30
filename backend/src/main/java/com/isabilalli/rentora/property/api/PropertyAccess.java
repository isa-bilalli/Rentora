package com.isabilalli.rentora.property.api;

import java.util.List;

public interface PropertyAccess {
    void requireBelongsToOrganization(Long propertyId, Long organizationId);
    Long countByOrganizationId(Long organizationId);
    List<Long> findIdsByOrganizationId(Long organizationId);
}
