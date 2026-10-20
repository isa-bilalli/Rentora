package com.isabilalli.rentora.auth.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

class SecuritySettingsTest {

    @EnableConfigurationProperties({CorsProperties.class, CookieProperties.class})
    static class Settings {
    }

    // Reads the real application.yml, plus application-prod.yml when the prod profile is on.
    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withUserConfiguration(Settings.class);

    @Test
    void localDefaultsAllowTheViteDevServerOverPlainHttp() {
        assumeNoOverridesOnThisMachine();

        runner.run(context -> {
            assertEquals(List.of("http://localhost:5173"), context.getBean(CorsProperties.class).allowedOrigins());
            assertFalse(context.getBean(CookieProperties.class).secure());
        });
    }

    @Test
    void originsAreACommaSeparatedList() {
        runner.withPropertyValues("CORS_ALLOWED_ORIGINS=https://app.example.com, https://admin.example.com")
                .run(context -> assertEquals(
                        List.of("https://app.example.com", "https://admin.example.com"),
                        context.getBean(CorsProperties.class).allowedOrigins()
                ));
    }

    @Test
    void anEmptyOriginListStopsStartup() {
        runner.withPropertyValues("CORS_ALLOWED_ORIGINS=")
                .run(context -> assertStartupFailedOnAllowedOrigins(context.getStartupFailure()));
    }

    @Test
    void prodUsesSecureCookies() {
        assumeNoOverridesOnThisMachine();

        runner.withPropertyValues("spring.profiles.active=prod", "CORS_ALLOWED_ORIGINS=https://app.example.com")
                .run(context -> {
                    assertEquals(List.of("https://app.example.com"), context.getBean(CorsProperties.class).allowedOrigins());
                    assertTrue(context.getBean(CookieProperties.class).secure());
                });
    }

    // Otherwise prod would start and then reject every request from the frontend's browser.
    @Test
    void prodStopsStartupWithoutAllowedOrigins() {
        assumeNoOverridesOnThisMachine();

        runner.withPropertyValues("spring.profiles.active=prod")
                .run(context -> assertStartupFailedOnAllowedOrigins(context.getStartupFailure()));
    }

    private static void assertStartupFailedOnAllowedOrigins(Throwable failure) {
        assertNotNull(failure, "the context started");
        StringBuilder messages = new StringBuilder();
        for (Throwable cause = failure; cause != null; cause = cause.getCause()) {
            messages.append(cause.getMessage()).append('\n');
        }
        assertTrue(messages.toString().contains("set CORS_ALLOWED_ORIGINS"), messages.toString());
    }

    // The settings fall back to environment variables, so ones set on this machine would change the defaults under test.
    private static void assumeNoOverridesOnThisMachine() {
        assumeTrue(System.getenv("CORS_ALLOWED_ORIGINS") == null && System.getenv("COOKIE_SECURE") == null);
    }
}
