package com.isabilalli.rentora.lease.api.event;

import java.time.LocalDate;

public record LeaseCreatedEvent(
        Long organizationId,
        Long leaseId,
        LocalDate startDate,
        LocalDate endDate,
        Long monthlyRentCents
) {}