package com.isabilalli.rentora.auth.api;

import com.isabilalli.rentora.auth.api.dto.LoginRequest;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.application.LoginService;
import com.isabilalli.rentora.auth.application.RefreshTokenService;
import com.isabilalli.rentora.auth.application.UserService;
import com.isabilalli.rentora.auth.config.CookieProperties;
import com.isabilalli.rentora.auth.infrastructure.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LoginControllerTest {

    @Mock
    private LoginService loginService;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private UserService userService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private JwtService jwtService;

    @Test
    void refreshCookieIsHttpsOnlyWhenSecureCookiesAreOn() {
        String cookie = loginCookie(true);

        assertTrue(cookie.contains("; Secure"), cookie);
        assertTrue(cookie.contains("; HttpOnly"), cookie);
    }

    @Test
    void refreshCookieAlsoWorksOverHttpWhenSecureCookiesAreOff() {
        String cookie = loginCookie(false);

        assertFalse(cookie.contains("Secure"), cookie);
        assertTrue(cookie.contains("; HttpOnly"), cookie);
    }

    // Logout replaces the cookie with an expired one built the same way.
    @Test
    void logoutClearsTheCookieWithTheSameSecureFlag() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        controller(true).logout(null, response);

        String cookie = response.getHeader(HttpHeaders.SET_COOKIE);
        assertTrue(cookie.startsWith("refreshToken=;"), cookie);
        assertTrue(cookie.contains("Max-Age=0"), cookie);
        assertTrue(cookie.contains("; Secure"), cookie);
    }

    private String loginCookie(boolean secureCookies) {
        LoginRequest request = new LoginRequest("owner@example.com", "password");
        when(loginService.login(request))
                .thenReturn(new LoginService.LoginResult(1L, "owner@example.com", "access-token", "refresh-token"));
        MockHttpServletResponse response = new MockHttpServletResponse();

        controller(secureCookies).login(request, response);

        return response.getHeader(HttpHeaders.SET_COOKIE);
    }

    private LoginController controller(boolean secureCookies) {
        return new LoginController(
                loginService,
                currentUserService,
                userService,
                refreshTokenService,
                jwtService,
                new CookieProperties(secureCookies)
        );
    }
}
