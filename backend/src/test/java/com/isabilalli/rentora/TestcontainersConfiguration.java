package com.isabilalli.rentora;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

// A throwaway PostgreSQL in Docker for tests that need a database, so they never touch the dev database.
// @ServiceConnection hands its address to Spring in place of DB_URL; Flyway builds the schema from V1.
// Import it with @Import(TestcontainersConfiguration.class) and @ActiveProfiles("test"). Docker must be running.
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    // The same major version as the dev database.
    @Bean
    @ServiceConnection
    PostgreSQLContainer postgresContainer() {
        return new PostgreSQLContainer(DockerImageName.parse("postgres:18-alpine"));
    }
}
