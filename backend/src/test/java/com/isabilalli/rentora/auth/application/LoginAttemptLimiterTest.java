package com.isabilalli.rentora.auth.application;

import com.isabilalli.rentora.auth.application.exception.TooManyLoginAttemptsException;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class LoginAttemptLimiterTest {

    private static final String EMAIL = "owner@example.com";
    private static final String ADDRESS = "203.0.113.7";

    // A clock the test moves by hand.
    private static final class TestClock extends Clock {
        private Instant now = Instant.parse("2026-10-29T09:00:00Z");

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }

    private final TestClock clock = new TestClock();
    private final LoginAttemptLimiter limiter = new LoginAttemptLimiter(clock);

    @Test
    void refusesAnEmailAfterFiveFailuresAndSaysHowLongToWait() {
        for (int attempt = 0; attempt < 5; attempt++) {
            assertDoesNotThrow(() -> limiter.checkAllowed(EMAIL, ADDRESS));
            limiter.recordFailure(EMAIL, ADDRESS);
            clock.advance(Duration.ofMinutes(1));
        }

        TooManyLoginAttemptsException refused = assertThrows(TooManyLoginAttemptsException.class, () -> limiter.checkAllowed(EMAIL, ADDRESS));

        // The first failure was 5 minutes ago, so it ages out in 10.
        assertEquals(Duration.ofMinutes(10), refused.getRetryAfter());
        assertEquals("Too many failed logins. Try again in 10 minutes.", refused.getMessage());
    }

    @Test
    void letsTheEmailTryAgainOnceTheOldestFailureIsFifteenMinutesOld() {
        failTimes(EMAIL, ADDRESS, 5);
        clock.advance(Duration.ofMinutes(15).minusSeconds(1));
        assertThrows(TooManyLoginAttemptsException.class, () -> limiter.checkAllowed(EMAIL, ADDRESS));

        clock.advance(Duration.ofSeconds(1));

        assertDoesNotThrow(() -> limiter.checkAllowed(EMAIL, ADDRESS));
    }

    @Test
    void theRightPasswordClearsTheEmailsFailures() {
        failTimes(EMAIL, ADDRESS, 4);
        limiter.recordSuccess(EMAIL);
        failTimes(EMAIL, ADDRESS, 4);

        assertDoesNotThrow(() -> limiter.checkAllowed(EMAIL, ADDRESS));
    }

    @Test
    void countsAnEmailWhateverItsCaseOrSpacing() {
        failTimes("Owner@Example.com", ADDRESS, 3);
        failTimes("  owner@example.com ", ADDRESS, 2);

        assertThrows(TooManyLoginAttemptsException.class, () -> limiter.checkAllowed(EMAIL, ADDRESS));
    }

    @Test
    void refusesAnAddressAfterTwentyFailuresAcrossEmails() {
        for (int account = 0; account < 20; account++) {
            limiter.recordFailure("person" + account + "@example.com", ADDRESS);
        }

        // A fresh email from that address is refused too; the same email from elsewhere is not.
        assertThrows(TooManyLoginAttemptsException.class, () -> limiter.checkAllowed("someone-new@example.com", ADDRESS));
        assertDoesNotThrow(() -> limiter.checkAllowed("someone-new@example.com", "198.51.100.1"));
    }

    @Test
    void otherEmailsAreUnaffected() {
        failTimes(EMAIL, ADDRESS, 5);

        assertDoesNotThrow(() -> limiter.checkAllowed("tenant@example.com", ADDRESS));
    }

    @Test
    void forgetsEmailsAndAddressesOnceTheirFailuresAgeOut() {
        failTimes(EMAIL, ADDRESS, 2);
        assertEquals(2, limiter.trackedEmailsAndAddresses());

        clock.advance(Duration.ofMinutes(15));
        limiter.forgetOldFailures();

        assertEquals(0, limiter.trackedEmailsAndAddresses());
    }

    private void failTimes(String email, String address, int times) {
        for (int attempt = 0; attempt < times; attempt++) {
            limiter.recordFailure(email, address);
        }
    }
}
