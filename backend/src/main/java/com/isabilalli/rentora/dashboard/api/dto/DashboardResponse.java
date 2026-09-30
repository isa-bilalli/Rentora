package com.isabilalli.rentora.dashboard.api.dto;

public record DashboardResponse(
        Portfolio portfolio,
        Financial financial,
        Operations operations
) {

    public record Portfolio(
            long totalProperties,
            long totalSpaces,
            long occupiedSpaces,
            long reservedSpaces,
            long vacantSpaces,
            long maintenanceSpaces
    ) {}

    public record Financial(
            long expectedRentCents,
            long collectedRentCents,
            long outstandingRentCents,
            long overdueRentCents,
            long paidExpensesCents,
            long unpaidExpensesCents,
            long netIncomeCents
    ) {}

    public record Operations(
            long activeLeases,
            long leasesExpiringSoon,
            long overduePayments,
            long openMaintenanceRequests
    ) {}
}