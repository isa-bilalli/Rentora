package com.isabilalli.rentora.lease.api;

import java.time.LocalDate;

public interface LeaseAccess {
    void requireBelongsToOrganization(Long leaseId, Long organizationId);
    Long countActiveLeases(Long organizationId);
    Long countLeasesExpiring(Long organizationId, LocalDate startDate, LocalDate endDate);
    Long sumOccupiedSpaceDays(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    Long countStartedLeases(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    Long countEndedLeases(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    Long countRenewedLeases(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    Long countLeasesExpiringBetween(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
}