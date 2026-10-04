export interface DashboardResponse {
    portfolio: Portfolio;
    financial: Financial;
    operations: Operations;
}

export interface Portfolio {
    totalProperties: number;
    totalSpaces: number;
    occupiedSpaces: number;
    reservedSpaces: number;
    vacantSpaces: number;
    maintenanceSpaces: number;
}

export interface Financial {
    expectedRentCents: number;
    collectedRentCents: number;
    outstandingRentCents: number;
    overdueRentCents: number;
    paidExpensesCents: number;
    unpaidExpensesCents: number;
    netIncomeCents: number;
}

export interface Operations {
    activeLeases: number;
    leasesExpiringSoon: number;
    overduePayments: number;
    openMaintenanceRequests: number;
}