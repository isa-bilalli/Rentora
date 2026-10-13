package com.isabilalli.rentora.lease.api;

import java.time.LocalDate;

public interface LeaseStatusAccess {

    boolean hasCurrentActiveLease(
            Long organizationId,
            Long spaceId,
            LocalDate today
    );

    boolean hasUpcomingActiveLease(
            Long organizationId,
            Long spaceId,
            LocalDate today
    );
}
