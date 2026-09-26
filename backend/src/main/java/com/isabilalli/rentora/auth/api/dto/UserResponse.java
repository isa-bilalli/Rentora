package com.isabilalli.rentora.auth.api.dto;

import com.isabilalli.rentora.auth.domain.User;

public record UserResponse(
        Long id,
        String firstName,
        String lastName,
        String email
) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail()
        );
    }
}