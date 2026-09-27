package com.isabilalli.rentora.payment.api;

import java.time.LocalDate;

public interface PaymentAccess {

    void generateRentObligations(
            Long organizationId,
            Long leaseId,
            LocalDate startDate,
            LocalDate endDate,
            Long monthlyRentCents
    );
}