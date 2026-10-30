package com.isabilalli.rentora.reporting.application;

import com.isabilalli.rentora.reporting.domain.ReportRange;
import com.isabilalli.rentora.reporting.domain.ReportingPeriod;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ReportRangeResolverTest {

    // Without a reference date a report covers the current period, by the app's time zone: 23:30 UTC on
    // New Year's Eve is already January in Belgrade.
    @Test
    void thisMonthIsTheAppTimeZonesMonth() {
        Clock newYearInBelgrade = Clock.fixed(Instant.parse("2025-12-31T23:30:00Z"), ZoneId.of("Europe/Belgrade"));

        ReportRange range = new ReportRangeResolver(newYearInBelgrade).resolve(ReportingPeriod.MONTH, null, null, null);

        assertEquals(new ReportRange(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31)), range);
    }
}
