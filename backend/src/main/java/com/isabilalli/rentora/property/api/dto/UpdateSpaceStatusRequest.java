package com.isabilalli.rentora.property.api.dto;

import com.isabilalli.rentora.property.domain.SpaceStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateSpaceStatusRequest(
        @NotNull SpaceStatus status
) {}