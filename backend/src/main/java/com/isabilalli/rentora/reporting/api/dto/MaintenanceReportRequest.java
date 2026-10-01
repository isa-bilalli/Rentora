package com.isabilalli.rentora.reporting.api.dto;

import com.isabilalli.rentora.reporting.domain.ReportingPeriod;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record MaintenanceReportRequest(
        @NotNull
        ReportingPeriod period,

        LocalDate referenceDate,

        LocalDate from,

        LocalDate to,

        Long propertyId
) {}