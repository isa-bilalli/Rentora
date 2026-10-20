package com.isabilalli.rentora.auth.config;

import jakarta.validation.constraints.NotEmpty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;

// The origins a browser may call the API from, e.g. "https://app.example.com".
// Set with CORS_ALLOWED_ORIGINS as a comma-separated list. Startup fails if it is empty.
@Validated
@ConfigurationProperties(prefix = "cors")
public record CorsProperties(
        @NotEmpty(message = "set CORS_ALLOWED_ORIGINS to the URL the frontend is served from")
        List<String> allowedOrigins
) {
}
