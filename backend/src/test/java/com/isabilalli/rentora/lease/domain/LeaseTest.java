package com.isabilalli.rentora.lease.domain;

import com.isabilalli.rentora.shared.api.BadRequestException;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LeaseTest {

    private static final LocalDate START = LocalDate.of(2030, 1, 1);
    private static final LocalDate END = LocalDate.of(2030, 12, 31);

    private Lease lease() {
        return new Lease(1L, 2L, 3L, START, END, 1_000_00L, 0L);
    }

    @Test
    void endingEarlyMakesEffectiveDateTheLastDay() {
        Lease lease = lease();

        lease.end(LocalDate.of(2030, 6, 15));

        assertEquals(LeaseStatus.ENDED, lease.getStatus());
        assertEquals(LocalDate.of(2030, 6, 15), lease.getEndDate());
    }

    @Test
    void expiringAfterScheduledEndKeepsEndDate() {
        Lease lease = lease();

        lease.end(LocalDate.of(2031, 1, 5));

        assertEquals(LeaseStatus.ENDED, lease.getStatus());
        assertEquals(END, lease.getEndDate());
    }

    @Test
    void endingBeforeLeaseStartsIsRejected() {
        Lease lease = lease();

        assertThrows(BadRequestException.class, () -> lease.end(START));

        assertEquals(LeaseStatus.ACTIVE, lease.getStatus());
        assertEquals(END, lease.getEndDate());
    }
}
