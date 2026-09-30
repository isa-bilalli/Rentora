package com.isabilalli.rentora.expense.api;

import java.time.LocalDate;
import java.util.List;

public interface ExpenseAccess {
    Long sumPaidExpenses(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    Long sumUnpaidExpenses(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    List<ExpenseCategoryTotal> sumExpensesByCategory(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId);
    record ExpenseCategoryTotal(
            String category,
            long amountCents
    ) {}
}