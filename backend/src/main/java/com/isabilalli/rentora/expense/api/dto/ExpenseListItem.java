package com.isabilalli.rentora.expense.api.dto;

// One row of the Expenses page: the expense, its state, and the property's and space's names, so the page needn't
// load every property and space to find them. spaceName is null for an expense about the whole property.
public record ExpenseListItem(
        ExpenseResponse expense,
        ExpenseState state,
        String propertyName,
        String spaceName
) {
}
