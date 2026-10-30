package com.isabilalli.rentora.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

// The clock every "today" comes from, in the zone TimeZoneProperties sets. Take dates with LocalDate.now(clock):
// plain LocalDate.now() uses the server's own zone, which is UTC in the Docker image.
@Configuration
public class ClockConfiguration {

    @Bean
    public Clock clock(TimeZoneProperties timeZoneProperties) {
        return Clock.system(timeZoneProperties.timeZone());
    }
}
