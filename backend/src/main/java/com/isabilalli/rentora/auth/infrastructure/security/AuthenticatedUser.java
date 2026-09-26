package com.isabilalli.rentora.auth.infrastructure.security;

public record AuthenticatedUser(
    Long userId,
    String email
) {
}
