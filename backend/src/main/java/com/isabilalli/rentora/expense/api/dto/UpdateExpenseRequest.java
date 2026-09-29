package com.isabilalli.rentora.expense.api.dto;

import com.isabilalli.rentora.expense.domain.ExpenseCategory;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateExpenseRequest(

        ExpenseCategory category,

        @Size(max = 150)
        String vendorName,

        @Size(max = 500)
        String description,

        @Min(0)
        Long amountCents,

        LocalDate expenseDate
) {}