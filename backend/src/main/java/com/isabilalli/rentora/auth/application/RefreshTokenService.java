package com.isabilalli.rentora.auth.application;

import com.isabilalli.rentora.auth.application.exception.InvalidRefreshTokenException;
import com.isabilalli.rentora.auth.config.JwtProperties;
import com.isabilalli.rentora.auth.domain.RefreshToken;
import com.isabilalli.rentora.auth.infrastructure.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Base64;

@Service
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;
    private final SecureRandom secureRandom = new SecureRandom();
    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository, JwtProperties jwtProperties) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public IssuedRefreshToken issue(Long userId) {
        String rawToken = generateToken();
        RefreshToken entity = new RefreshToken(userId, hashToken(rawToken), OffsetDateTime.now().plus(Duration.ofMillis(jwtProperties.refreshExpiration())));
        RefreshToken saved = refreshTokenRepository.save(entity);
        return new IssuedRefreshToken(rawToken, saved);
    }

    @Transactional
    public IssuedRefreshToken rotate(String rawToken) {
        RefreshToken current = refreshTokenRepository.findByTokenHash(hashToken(rawToken)).orElseThrow(() -> new InvalidRefreshTokenException("Invalid refresh token"));
        if (current.isExpired()) {
            throw new InvalidRefreshTokenException("Refresh token has expired");
        }
        if (current.isRevoked()) {
            throw new InvalidRefreshTokenException("Refresh token has already been revoked");
        }
        current.revoke();
        IssuedRefreshToken replacement = issue(current.getUserId());
        current.markReplacedBy(replacement.entity().getId());
        refreshTokenRepository.save(current);
        return replacement;
    }

    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(hashToken(rawToken)).ifPresent(token -> {
            if (!token.isRevoked()) {
                token.revoke();
                refreshTokenRepository.save(token);
            }
        });
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte byteValue : bytes) {
            result.append(String.format("%02x", byteValue));
        }
        return result.toString();
    }
    public record IssuedRefreshToken(
            String rawToken,
            RefreshToken entity
    ) {
    }
}