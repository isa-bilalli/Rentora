package com.isabilalli.rentora.expense.api.dto;

import com.isabilalli.rentora.expense.domain.Expense;
import com.isabilalli.rentora.expense.domain.ExpenseStatus;

// One state for the Expenses page, combining status and the paid flag, the same rule as the frontend's
// getExpenseState. A voided expense no longer counts, whether or not it had been paid.
public enum ExpenseState {
    UNPAID,
    PAID,
    VOIDED;

    public static ExpenseState of(Expense expense) {
        if (expense.getStatus() == ExpenseStatus.VOIDED) {
            return VOIDED;
        }
        return expense.isPaid() ? PAID : UNPAID;
    }
}
