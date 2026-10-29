package com.isabilalli.rentora.expense.infrastructure;

import com.isabilalli.rentora.expense.domain.Expense;

// An expense with the names the Expenses page shows beside it, as ExpenseRepository.findListPage reads them.
public record ExpenseListRow(
        Expense expense,
        String propertyName,
        String spaceName
) {
}
