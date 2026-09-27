package com.isabilalli.rentora.tenant.api;

public interface TenantAccess {
    void requireBelongsToOrganization(
        Long tenantId,
        Long organizationId
    );
}
