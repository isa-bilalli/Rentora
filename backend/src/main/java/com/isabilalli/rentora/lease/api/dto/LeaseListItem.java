package com.isabilalli.rentora.lease.api.dto;

// One row of the Leases page: the lease, with the names the page shows beside it, so the page needn't load
// every tenant, property and space to find them.
public record LeaseListItem(
        LeaseResponse lease,
        LeaseDisplayStatus status,
        String tenantName,
        Long propertyId,
        String propertyName,
        String spaceName
) {
}
