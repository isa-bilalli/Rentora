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

    public LoginService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, RefreshTokenService refreshTokenService){
        this.userRepository=userRepository;
        this.passwordEncoder=passwordEncoder;
        this.jwtService=jwtService;
        this.refreshTokenService=refreshTokenService;
    }

    public record LoginResult(
        Long userId,
        String email,
        String accessToken,
        String refreshToken
) {}

    public LoginResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email()).orElseThrow(() -> new InvalidCredentialsException());
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        String accessToken = jwtService.generateToken(user.getId(), user.getEmail());
        RefreshTokenService.IssuedRefreshToken refreshToken = refreshTokenService.issue(user.getId());
        return new LoginResult(user.getId(), user.getEmail(), accessToken, refreshToken.rawToken());
    }
}