package com.isabilalli.rentora.reporting.domain;

import java.time.LocalDate;

public record ReportRange(
        LocalDate startDate,
        LocalDate endDate
) {
    public ReportRange {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException(
                    "Report dates cannot be null"
            );
        }

        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException(
                    "Report end date cannot be before start date"
            );
        }
    }
}