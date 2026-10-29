package com.isabilalli.rentora.auth.application;

import com.isabilalli.rentora.auth.application.exception.InvalidCredentialsException;
import org.springframework.stereotype.Service;

import com.isabilalli.rentora.auth.api.dto.LoginRequest;
import com.isabilalli.rentora.auth.domain.User;
import com.isabilalli.rentora.auth.infrastructure.UserRepository;
import com.isabilalli.rentora.auth.infrastructure.security.JwtService;

import org.springframework.security.crypto.password.PasswordEncoder;

@Service 
public class LoginService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final LoginAttemptLimiter loginAttemptLimiter;

    public LoginService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenService refreshTokenService, LoginAttemptLimiter loginAttemptLimiter){
        this.userRepository=userRepository;
        this.passwordEncoder=passwordEncoder;
        this.jwtService=jwtService;
        this.refreshTokenService=refreshTokenService;
        this.loginAttemptLimiter=loginAttemptLimiter;
    }

    public record LoginResult(
        Long userId,
        String email,
        String accessToken,
        String refreshToken
) {}

    // clientAddress is where the request came from, for the per-address limit on failed logins.
    public LoginResult login(LoginRequest request, String clientAddress) {
        // Checked before the password, so a refused attempt can't tell a guess was right.
        loginAttemptLimiter.checkAllowed(request.email(), clientAddress);
        User user = userRepository.findByEmail(request.email()).orElse(null);
        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            loginAttemptLimiter.recordFailure(request.email(), clientAddress);
            throw new InvalidCredentialsException();
        }
        loginAttemptLimiter.recordSuccess(request.email());
        String accessToken = jwtService.generateToken(user.getId(), user.getEmail());
        RefreshTokenService.IssuedRefreshToken refreshToken = refreshTokenService.issue(user.getId());
        return new LoginResult(user.getId(), user.getEmail(), accessToken, refreshToken.rawToken());
    }
}