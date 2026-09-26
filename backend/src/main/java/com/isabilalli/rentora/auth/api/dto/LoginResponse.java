package com.isabilalli.rentora.auth.api.dto;

public record LoginResponse(
    Long userId,
    String email,
    String accessToken
) {
    
}
