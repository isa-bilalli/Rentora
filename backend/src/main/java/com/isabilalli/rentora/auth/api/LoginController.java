package com.isabilalli.rentora.auth.api;

import com.isabilalli.rentora.auth.api.dto.LoginRequest;
import com.isabilalli.rentora.auth.api.dto.LoginResponse;
import com.isabilalli.rentora.auth.api.dto.RefreshResponse;
import com.isabilalli.rentora.auth.api.dto.UserResponse;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.application.LoginService;
import com.isabilalli.rentora.auth.application.RefreshTokenService;
import com.isabilalli.rentora.auth.application.UserService;
import com.isabilalli.rentora.auth.application.exception.InvalidRefreshTokenException;
import com.isabilalli.rentora.auth.domain.RefreshToken;
import com.isabilalli.rentora.auth.domain.User;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.auth.infrastructure.security.JwtService;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;

import org.springframework.http.HttpHeaders;
import java.time.Duration;

import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;


@RestController 
@RequestMapping("/api/auth") 
public class LoginController {
    private final CurrentUserService currentUserService;
    private final LoginService loginService;
    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    public LoginController(LoginService loginService, CurrentUserService currentUserService, UserService userService, RefreshTokenService refreshTokenService, JwtService jwtService){
        this.loginService=loginService;
        this.currentUserService = currentUserService;
        this.userService = userService;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        LoginService.LoginResult result = loginService.login(request);
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", result.refreshToken())
            .httpOnly(true)
            //TRUE IN HTTPS CONFIG
            .secure(false)
            .sameSite("Lax")
            .path("/api/auth")
            .maxAge(Duration.ofDays(7))
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        return ResponseEntity.ok(new LoginResponse(result.userId(), result.email(), result.accessToken()));
    }
    
    @GetMapping("/me")
    public ResponseEntity<UserResponse> me() {
        AuthenticatedUser currentUser = currentUserService.getCurrentUser();
        User user = userService.findById(currentUser.userId());
        return ResponseEntity.ok(UserResponse.from(user));
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(@CookieValue(value = "refreshToken", required = false) String refreshToken, HttpServletResponse response ){
        if(refreshToken == null || refreshToken.isBlank()){
            throw new InvalidRefreshTokenException("Refresh token is missing");
        }
        RefreshTokenService.IssuedRefreshToken rotatedToken = refreshTokenService.rotate(refreshToken);
        RefreshToken tokenEntity = rotatedToken.entity();
        User user = userService.findById(tokenEntity.getUserId());

        String accessToken = jwtService.generateToken(user.getId(), user.getEmail());
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", rotatedToken.rawToken())
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .path("/api/auth")
            .maxAge(Duration.ofDays(7))
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        return ResponseEntity.ok(new RefreshResponse(accessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@CookieValue (value = "refreshToken", required = false) String refreshToken, HttpServletResponse response) {
        if(refreshToken != null || !refreshToken.isBlank()){
            refreshTokenService.revoke(refreshToken);
        }
        ResponseCookie clearCookie = ResponseCookie.from("refreshToken", "")
            .httpOnly(true)
            .secure(false)
            .sameSite("Lax")
            .maxAge(0)
            .build();
        response.addHeader(HttpHeaders.SET_COOKIE, clearCookie.toString());
        return ResponseEntity.noContent().build();
    }
}
