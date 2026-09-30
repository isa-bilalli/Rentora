package com.isabilalli.rentora.expense.infrastructure;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.isabilalli.rentora.expense.domain.Expense;
import com.isabilalli.rentora.expense.domain.ExpenseStatus;

public interface ExpenseRepository extends JpaRepository<Expense, Long>{
    List<Expense> findAllByOrganizationId(Long organizationId);
    List<Expense> findAllByPropertyId(Long propertyId);
    List<Expense> findAllByStatus(ExpenseStatus status);
    List<Expense> findAllByOrganizationIdAndPaid(Long oranizationId, boolean paid, ExpenseStatus status);
    @Query("""
        SELECT COALESCE(SUM(e.amountCents), 0)
        FROM Expense e
        WHERE e.organizationId = :organizationId
            AND e.expenseDate >= :startDate
            AND e.expenseDate <= :endDate
            AND e.status = :status
            AND e.paid = :paid
    """)
    long sumByOrganizationAndPeriodAndPaid(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("status") ExpenseStatus status, @Param("paid") boolean paid);
}
