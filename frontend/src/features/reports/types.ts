import type { ExpenseCategory } from "../expenses/types";

export type ReportingPeriod = "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";

// Which dates a report covers. The responses don't echo the range back.
// MONTH, QUARTER and YEAR: the calendar month, quarter or year containing referenceDate (today when left out).
// CUSTOM: from to `to`, both included; both are required and `to` can't be before `from`.
// All dates are "YYYY-MM-DD".
export interface ReportPeriodRequest {
    period: ReportingPeriod;
    referenceDate?: string;
    from?: string;
    to?: string;
}

// Rent figures cover payments due in the range; overdue rent is everything still pending that was due
// before the range ended, however long ago. Expenses exclude voided ones.
export interface FinancialReportResponse {
    expectedRentCents: number;
    collectedRentCents: number;
    outstandingRentCents: number;
    overdueRentCents: number;
    // Collected as a percentage of expected, 0–100 (0 when nothing was expected).
    collectionRate: number;
    paidExpensesCents: number;
    unpaidExpensesCents: number;
    // Collected rent minus paid expenses.
    netIncomeCents: number;
    // Alphabetical by category; categories with no expenses are left out.
    expensesByCategory: { category: ExpenseCategory; amountCents: number }[];
}

export interface OccupancyReportResponse {
    totalSpaces: number;
    // Days in the range.
    totalDays: number;
    // Sum over leases of the days each was in effect during the range.
    occupiedSpaceDays: number;
    averageOccupiedSpaces: number;
    // Occupied space-days as a percentage of all possible space-days, 0–100.
    occupancyRate: number;
}

export interface LeaseReportResponse {
    leasesStarted: number;
    leasesEnded: number;
    leasesRenewed: number;
    // Active leases whose end date falls in the range.
    leasesExpiring: number;
}

export interface MaintenanceReportResponse {
    requestsOpened: number;
    requestsResolved: number;
    requestsCancelled: number;
    // 0 when nothing was resolved in the range.
    averageResolutionHours: number;
}
