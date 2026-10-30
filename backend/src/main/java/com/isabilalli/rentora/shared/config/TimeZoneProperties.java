package com.isabilalli.rentora.shared.config;

import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.ZoneId;

// The time zone that decides what day it is, e.g. "Europe/Belgrade". Set with APP_TIME_ZONE.
// Leases start and end, payments fall overdue and reports pick their month by this zone's date, and the
// nightly lease job runs just after its midnight, whatever zone the server itself runs in.
// Startup fails on an empty or unknown zone.
@Validated
@ConfigurationProperties(prefix = "app")
public record TimeZoneProperties(
        @NotNull(message = "set APP_TIME_ZONE to a time zone such as Europe/Belgrade")
        ZoneId timeZone
) {
}
