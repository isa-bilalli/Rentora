package com.isabilalli.rentora.reporting.api.dto;

public record MaintenanceReportResponse(
        long requestsOpened,
        long requestsResolved,
        long requestsCancelled,
        double averageResolutionHours
) {}