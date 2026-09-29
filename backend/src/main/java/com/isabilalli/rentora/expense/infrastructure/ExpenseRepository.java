package com.isabilalli.rentora.expense.infrastructure;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.isabilalli.rentora.expense.domain.Expense;
import com.isabilalli.rentora.expense.domain.ExpenseStatus;

public interface ExpenseRepository extends JpaRepository<Expense, Long>{
    List<Expense> findAllByOrganizationId(Long organizationId);
    List<Expense> findAllByPropertyId(Long propertyId);
    List<Expense> findAllByStatus(ExpenseStatus status);
    List<Expense> findAllByOrganizationIdAndPaid(Long oranizationId, boolean paid, ExpenseStatus status);
}
