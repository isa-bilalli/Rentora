package com.isabilalli.rentora.lease.api.event;

import java.time.LocalDate;

public record LeaseEndedEvent(
        Long leaseId,
        LocalDate endDate
) {}
