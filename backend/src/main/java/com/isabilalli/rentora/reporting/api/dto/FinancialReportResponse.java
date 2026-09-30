package com.isabilalli.rentora.reporting.api.dto;

import java.util.List;

public record FinancialReportResponse(
        long expectedRentCents,
        long collectedRentCents,
        long outstandingRentCents,
        long overdueRentCents,
        double collectionRate,
        long paidExpensesCents,
        long unpaidExpensesCents,
        long netIncomeCents,
        List<ExpenseCategoryTotal> expensesByCategory
) {
    public record ExpenseCategoryTotal(String category, Long amountCents) {}
}