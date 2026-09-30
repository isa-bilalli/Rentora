package com.isabilalli.rentora.reporting.api.dto;

public record OccupancyReportResponse(
        long totalSpaces,
        long totalDays,
        long occupiedSpaceDays,
        double averageOccupiedSpaces,
        double occupancyRate
) {}