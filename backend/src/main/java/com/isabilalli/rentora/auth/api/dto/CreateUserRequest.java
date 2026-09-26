package com.isabilalli.rentora.auth.api.dto;

public record CreateUserRequest(
        String firstName,
        String lastName,
        String email,
        String password
) {
}