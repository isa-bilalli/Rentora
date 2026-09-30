package com.isabilalli.rentora.expense.api;

import java.time.LocalDate;

public interface ExpenseAccess {
    Long sumPaidExpenses(Long organizationId, LocalDate startDate, LocalDate endDate);
    Long sumUnpaidExpenses(Long organizationId, LocalDate startDate, LocalDate endDate);
}