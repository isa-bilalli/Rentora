package com.isabilalli.rentora.lease.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record CreateLeaseRequest(

        @NotNull
        Long tenantId,

        @NotNull
        Long spaceId,

        @NotNull
        LocalDate startDate,

        @NotNull
        LocalDate endDate,

        @NotNull
        @Min(0)
        Long monthlyRentCents,

        @NotNull
        @Min(0)
        Long securityDepositCents
) {}