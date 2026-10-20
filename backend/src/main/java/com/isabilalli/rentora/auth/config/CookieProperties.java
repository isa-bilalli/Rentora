package com.isabilalli.rentora.auth.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// Set with COOKIE_SECURE. True sends the refresh-token cookie over HTTPS only;
// false is for local development, where the servers use plain HTTP.
@ConfigurationProperties(prefix = "cookie")
public record CookieProperties(
        boolean secure
) {
}
