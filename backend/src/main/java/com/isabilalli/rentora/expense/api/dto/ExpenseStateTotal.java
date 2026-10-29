package com.isabilalli.rentora.expense.api.dto;

// How many expenses one property has in one state, and what they add up to. The Expenses page adds these up for
// its filter counts (each following the other filter's choice) and for the total of what's shown.
public record ExpenseStateTotal(
        ExpenseState state,
        Long propertyId,
        long expenses,
        long amountCents
) {
}
