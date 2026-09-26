package com.isabilalli.rentora.property.api.dto;

import com.isabilalli.rentora.property.domain.SpaceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateSpaceRequest(

        @NotBlank
        @Size(max = 100)
        String name,

        @NotNull
        SpaceType type,

        Integer floor,

        @DecimalMin(value = "0.0", inclusive = false)
        BigDecimal area
) {}