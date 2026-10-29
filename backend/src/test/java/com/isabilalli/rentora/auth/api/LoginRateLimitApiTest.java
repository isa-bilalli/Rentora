package com.isabilalli.rentora.auth.api;

import com.isabilalli.rentora.TestcontainersConfiguration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.client.EntityExchangeResult;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// The login limit over real HTTP, against the throwaway PostgreSQL from TestcontainersConfiguration.
// Every email is new to the run, since the limiter and the database outlive one test.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class LoginRateLimitApiTest {

    private static final String PASSWORD = "test-password-123";

    @LocalServerPort
    private int port;

    private RestTestClient client;

    @BeforeEach
    void setUp() {
        client = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    @Test
    void afterFiveWrongPasswordsEvenTheRightOneIsRefusedForAWhile() {
        String email = signUp();

        for (int attempt = 1; attempt <= 5; attempt++) {
            assertEquals(401, login(email, "wrong-password").getStatus().value(), "attempt " + attempt);
        }
        EntityExchangeResult<Map> refused = login(email, PASSWORD);

        assertEquals(429, refused.getStatus().value());
        assertEquals("Too many failed logins. Try again in 15 minutes.", refused.getResponseBody().get("error"));
        long retryAfter = Long.parseLong(refused.getResponseHeaders().getFirst(HttpHeaders.RETRY_AFTER));
        assertTrue(retryAfter > 0 && retryAfter <= 15 * 60, "Retry-After " + retryAfter);
    }

    @Test
    void otherAccountsFromTheSameAddressCanStillLogIn() {
        String lockedOut = signUp();
        for (int attempt = 0; attempt < 5; attempt++) {
            login(lockedOut, "wrong-password");
        }

        assertEquals(200, login(signUp(), PASSWORD).getStatus().value());
    }

    private String signUp() {
        String email = "login-limit-" + UUID.randomUUID().toString().substring(0, 8) + "@rentora.test";
        EntityExchangeResult<Map> registered = post("/api/auth/register", Map.of(
                "organizationName", "Login limit test", "firstName", "Login", "lastName", "Tester",
                "email", email, "password", PASSWORD));
        assertEquals(201, registered.getStatus().value(), String.valueOf(registered.getResponseBody()));
        return email;
    }

    private EntityExchangeResult<Map> login(String email, String password) {
        return post("/api/auth/login", Map.of("email", email, "password", password));
    }

    private EntityExchangeResult<Map> post(String path, Object body) {
        return client.post().uri(path).contentType(MediaType.APPLICATION_JSON).body(body)
                .exchange().expectBody(Map.class).returnResult();
    }
}
