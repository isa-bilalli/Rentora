package com.isabilalli.rentora.property.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePropertyRequest(
    @NotBlank 
    @Size (max = 150)
    String name,

    @NotBlank
    @Size(max = 255)
    String addressLine,

    @NotBlank
    @Size(max = 100)
    String city,

    @Size(max = 20)
    String postalCode,

    @NotBlank
    @Size(max = 100)
    String country
) {
    
}