package com.isabilalli.rentora.auth.api.dto;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email
) {
}