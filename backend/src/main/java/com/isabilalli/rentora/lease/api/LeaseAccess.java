package com.isabilalli.rentora.lease.api;

public interface LeaseAccess {

    void requireBelongsToOrganization(
            Long leaseId,
            Long organizationId
    );
}