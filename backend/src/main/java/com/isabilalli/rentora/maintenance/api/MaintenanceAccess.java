package com.isabilalli.rentora.maintenance.api;

import java.time.LocalDate;

public interface MaintenanceAccess {
    Long countOpenRequests(Long organizationId);
    Long countOpenedRequests(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    Long countResolvedRequests(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    Long countCancelledRequests(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    double averageResolutionHours(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
}