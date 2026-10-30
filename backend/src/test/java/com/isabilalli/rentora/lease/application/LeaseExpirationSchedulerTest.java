package com.isabilalli.rentora.lease.application;

import com.isabilalli.rentora.lease.domain.LeaseStatus;
import com.isabilalli.rentora.lease.infrastructure.LeaseRepository;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class LeaseExpirationSchedulerTest {

    @Mock
    private LeaseRepository leaseRepository;

    @Mock
    private LeaseService leaseService;

    // The job runs at 00:05 in its zone, when a server on UTC still has yesterday's date. It must use the
    // zone's date, or leases would end and start a day late.
    @Test
    void takesTodayFromTheSchedulersTimeZone() {
        Clock fiveMinutesAfterMidnightInBelgrade = Clock.fixed(Instant.parse("2025-12-31T23:05:00Z"), ZoneId.of("Europe/Belgrade"));
        LocalDate belgradeToday = LocalDate.of(2026, 1, 1);

        new LeaseExpirationScheduler(leaseRepository, leaseService, fiveMinutesAfterMidnightInBelgrade).runDailyLeaseJobs();

        verify(leaseRepository).findAllByStatusAndEndDateBefore(LeaseStatus.ACTIVE, belgradeToday);
        verify(leaseRepository).findAllByStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                LeaseStatus.ACTIVE, belgradeToday, belgradeToday);
    }
}
