package com.isabilalli.rentora.shared.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.time.Clock;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class TimeZonePropertiesTest {

    @EnableConfigurationProperties(TimeZoneProperties.class)
    static class Settings {
    }

    // Reads the real application.yml.
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withUserConfiguration(Settings.class, ClockConfiguration.class);

    @Test
    void keepsBelgradesDaysUnlessSet() {
        // The setting falls back to the environment variable, so one set on this machine would change the default.
        assumeTrue(System.getenv("APP_TIME_ZONE") == null);

        runner.run(context -> assertEquals(ZoneId.of("Europe/Belgrade"), context.getBean(TimeZoneProperties.class).timeZone()));
    }

    // Every "today" in the backend comes from this clock.
    @Test
    void theClockKeepsTheSetTimeZone() {
        runner.withPropertyValues("APP_TIME_ZONE=America/New_York")
                .run(context -> assertEquals(ZoneId.of("America/New_York"), context.getBean(Clock.class).getZone()));
    }

    @Test
    void anUnknownTimeZoneStopsStartup() {
        runner.withPropertyValues("APP_TIME_ZONE=Europe/Atlantis")
                .run(context -> assertStartupFailedOnTimeZone(context.getStartupFailure()));
    }

    @Test
    void anEmptyTimeZoneStopsStartup() {
        runner.withPropertyValues("APP_TIME_ZONE=")
                .run(context -> assertStartupFailedOnTimeZone(context.getStartupFailure()));
    }

    private static void assertStartupFailedOnTimeZone(Throwable failure) {
        assertNotNull(failure, "the context started");
        StringBuilder messages = new StringBuilder();
        for (Throwable cause = failure; cause != null; cause = cause.getCause()) {
            messages.append(cause.getMessage()).append('\n');
        }
        assertTrue(messages.toString().contains("app.time-zone"), messages.toString());
    }
}
