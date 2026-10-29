package com.isabilalli.rentora.lease.infrastructure;

import com.isabilalli.rentora.lease.domain.Lease;

// A lease with the names the Leases page shows beside it, as LeaseRepository.findListPage reads them.
public record LeaseListRow(
        Lease lease,
        String tenantFirstName,
        String tenantLastName,
        String tenantCompanyName,
        Long propertyId,
        String propertyName,
        String spaceName
) {
}
