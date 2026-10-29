package com.isabilalli.rentora.lease.api.dto;

import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.domain.LeaseStatus;

import java.time.LocalDate;

// A lease's status as the Leases page shows it. The backend calls a lease that hasn't started yet ACTIVE;
// the page shows it as UPCOMING, the same rule as the frontend's getLeaseDisplayStatus.
public enum LeaseDisplayStatus {
    UPCOMING,
    ACTIVE,
    ENDED,
    CANCELLED;

    public static LeaseDisplayStatus of(Lease lease, LocalDate today) {
        if (lease.getStatus() == LeaseStatus.ACTIVE && lease.getStartDate().isAfter(today)) {
            return UPCOMING;
        }
        return valueOf(lease.getStatus().name());
    }
}
