package com.isabilalli.rentora.expense.api.dto;

import com.isabilalli.rentora.expense.domain.Expense;
import com.isabilalli.rentora.expense.domain.ExpenseCategory;
import com.isabilalli.rentora.expense.domain.ExpenseStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record ExpenseResponse(
        Long id,
        Long organizationId,
        Long propertyId,
        Long spaceId,
        ExpenseCategory category,
        String vendorName,
        String description,
        Long amountCents,
        LocalDate expenseDate,
        boolean paid,
        ExpenseStatus status,
        Long recordedByUserId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static ExpenseResponse from(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getOrganizationId(),
                expense.getPropertyId(),
                expense.getSpaceId(),
                expense.getCategory(),
                expense.getVendorName(),
                expense.getDescription(),
                expense.getAmountCents(),
                expense.getExpenseDate(),
                expense.isPaid(),
                expense.getStatus(),
                expense.getRecordedByUserId(),
                expense.getCreatedAt(),
                expense.getUpdatedAt()
        );
    }
}