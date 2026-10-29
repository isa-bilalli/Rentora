package com.isabilalli.rentora.auth.application;

import com.isabilalli.rentora.auth.application.exception.TooManyLoginAttemptsException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

// Slows down password guessing. After too many failed logins for one email, or from one address, within WINDOW,
// further attempts are refused, whatever the password, until the oldest of those failures is WINDOW old.
// The address limit is higher, since an office can share one address; it stops one source trying many emails.
// The counts live in memory: they reset on restart and aren't shared between instances, which suits the
// single backend that docker-compose runs.
@Component
public class LoginAttemptLimiter {

    static final int MAX_FAILURES_PER_EMAIL = 5;
    static final int MAX_FAILURES_PER_ADDRESS = 20;
    static final Duration WINDOW = Duration.ofMinutes(15);

    private final Clock clock;
    // The most recent failures for each email and each address, oldest first, at most the limit's worth.
    private final Map<String, Deque<Instant>> failuresByEmail = new HashMap<>();
    private final Map<String, Deque<Instant>> failuresByAddress = new HashMap<>();

    public LoginAttemptLimiter() {
        this(Clock.systemUTC());
    }

    LoginAttemptLimiter(Clock clock) {
        this.clock = clock;
    }

    // Throws, saying how long to wait, when this email or address has no attempts left.
    public synchronized void checkAllowed(String email, String address) {
        Instant now = clock.instant();
        Duration wait = waitFor(failuresByEmail, emailKey(email), MAX_FAILURES_PER_EMAIL, now);
        Duration addressWait = waitFor(failuresByAddress, address, MAX_FAILURES_PER_ADDRESS, now);
        if (addressWait.compareTo(wait) > 0) {
            wait = addressWait;
        }
        if (!wait.isZero()) {
            throw new TooManyLoginAttemptsException(wait);
        }
    }

    public synchronized void recordFailure(String email, String address) {
        Instant now = clock.instant();
        add(failuresByEmail, emailKey(email), MAX_FAILURES_PER_EMAIL, now);
        add(failuresByAddress, address, MAX_FAILURES_PER_ADDRESS, now);
    }

    // The right password clears the email's failures. The address keeps its own until they age out, so one
    // working account doesn't reset the count for every other email tried from there.
    public synchronized void recordSuccess(String email) {
        failuresByEmail.remove(emailKey(email));
    }

    // Forgets emails and addresses whose failures have all aged out, so the maps don't keep everything ever tried.
    @Scheduled(fixedRate = 15, timeUnit = TimeUnit.MINUTES)
    public synchronized void forgetOldFailures() {
        Instant now = clock.instant();
        failuresByEmail.values().forEach(times -> dropOld(times, now));
        failuresByEmail.values().removeIf(Deque::isEmpty);
        failuresByAddress.values().forEach(times -> dropOld(times, now));
        failuresByAddress.values().removeIf(Deque::isEmpty);
    }

    synchronized int trackedEmailsAndAddresses() {
        return failuresByEmail.size() + failuresByAddress.size();
    }

    private static Duration waitFor(Map<String, Deque<Instant>> failures, String key, int limit, Instant now) {
        Deque<Instant> times = failures.get(key);
        if (times == null) {
            return Duration.ZERO;
        }
        dropOld(times, now);
        if (times.size() < limit) {
            return Duration.ZERO;
        }
        return Duration.between(now, times.peekFirst().plus(WINDOW));
    }

    private static void add(Map<String, Deque<Instant>> failures, String key, int limit, Instant now) {
        Deque<Instant> times = failures.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        dropOld(times, now);
        times.addLast(now);
        // Only the last `limit` failures decide when the next attempt is allowed.
        while (times.size() > limit) {
            times.removeFirst();
        }
    }

    private static void dropOld(Deque<Instant> times, Instant now) {
        while (!times.isEmpty() && !times.peekFirst().plus(WINDOW).isAfter(now)) {
            times.removeFirst();
        }
    }

    // Emails differ only in case and spacing count as one, so changing them doesn't buy more attempts.
    private static String emailKey(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
