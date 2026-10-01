package com.isabilalli.rentora.reporting.api.dto;

public record LeaseReportResponse(
        long leasesStarted,
        long leasesEnded,
        long leasesRenewed,
        long leasesExpiring
) {}