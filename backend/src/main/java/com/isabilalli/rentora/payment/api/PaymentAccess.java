package com.isabilalli.rentora.payment.api;

import java.time.LocalDate;

public interface PaymentAccess {

    void generateRentObligations(Long organizationId, Long leaseId, LocalDate startDate, LocalDate endDate, Long monthlyRentCents);
    Long sumExpectedRent(Long organizationId,LocalDate startDate, LocalDate endDate, Long propertyId);
    Long sumPaidRent(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    Long sumOutstandingRent(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    Long sumOverdueRent(Long organizationId, LocalDate beforeDate, Long propertyId);
    Long countOverduePayments(Long organizationId, LocalDate beforeDate);
}