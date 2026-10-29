package com.isabilalli.rentora.auth.application.exception;

import java.time.Duration;

public class TooManyLoginAttemptsException extends RuntimeException {

    // How long until the next attempt is allowed.
    private final Duration retryAfter;

    public TooManyLoginAttemptsException(Duration retryAfter) {
        super(message(retryAfter));
        this.retryAfter = retryAfter;
    }

    public Duration getRetryAfter() {
        return retryAfter;
    }

    private static String message(Duration retryAfter) {
        long minutes = Math.max(1, (retryAfter.toSeconds() + 59) / 60);
        return "Too many failed logins. Try again in " + minutes + (minutes == 1 ? " minute." : " minutes.");
    }
}
