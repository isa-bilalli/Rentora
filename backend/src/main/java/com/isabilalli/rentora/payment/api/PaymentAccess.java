package com.isabilalli.rentora.payment.api;

import java.time.LocalDate;

public interface PaymentAccess {

    void generateRentObligations(Long organizationId, Long leaseId, LocalDate startDate, LocalDate endDate, Long monthlyRentCents);
    Long sumExpectedRent(Long organizationId,LocalDate startDate, LocalDate endDate);
    Long sumPaidRent(Long organizationId, LocalDate startDate, LocalDate endDate);
    Long sumOutstandingRent(Long organizationId, LocalDate startDate, LocalDate endDate);
    Long sumOverdueRent(Long organizationId, LocalDate beforeDate);
    Long countOverduePayments(Long organizationId, LocalDate beforeDate);
}