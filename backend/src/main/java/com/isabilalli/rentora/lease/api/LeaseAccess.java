package com.isabilalli.rentora.lease.api;

import java.time.LocalDate;

public interface LeaseAccess {
    void requireBelongsToOrganization(Long leaseId, Long organizationId);
    Long countActiveLeases(Long organizationId);
    Long countLeasesExpiring(Long organizationId, LocalDate startDate, LocalDate enddDate);
}