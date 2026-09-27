package com.isabilalli.rentora.lease.api.dto;

import jakarta.validation.constraints.Min;

import java.time.LocalDate;

public record UpdateLeaseRequest(

        LocalDate startDate,

        LocalDate endDate,

        @Min(0)
        Long monthlyRentCents,

        @Min(0)
        Long securityDepositCents
) {}