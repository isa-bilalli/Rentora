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
          AND (:propertyId IS NULL OR e.propertyId = :propertyId)
        """)
    Long sumByOrganizationAndPeriodAndPaid(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("status") ExpenseStatus status, @Param("paid") boolean paid, @Param("propertyId") Long propertyId);

    @Query("""
        SELECT COALESCE(SUM(e.amountCents), 0)
        FROM Expense e
        WHERE e.organizationId = :organizationId
          AND e.expenseDate >= :startDate
          AND e.expenseDate <= :endDate
          AND e.status = :status
          AND e.paid = :paid
          AND (:propertyId IS NULL OR e.propertyId = :propertyId)
            """)
    Long sumByPeriodAndPaid(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("status") ExpenseStatus status, @Param("paid") boolean paid, @Param("propertyId") Long propertyId);

    interface ExpenseCategoryProjection {
        String getCategory();
        Long getAmountCents();
    }

    @Query("""
        SELECT
            e.category AS category,
            COALESCE(SUM(e.amountCents), 0) AS amountCents
        FROM Expense e
        WHERE e.organizationId = :organizationId
          AND e.expenseDate >= :startDate
          AND e.expenseDate <= :endDate
          AND e.status = :status
          AND (:propertyId IS NULL OR e.propertyId = :propertyId)
        GROUP BY e.category
        ORDER BY e.category
        """)
    List<ExpenseCategoryProjection> sumByCategory(@Param("organizationId") Long organizationId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("status") ExpenseStatus status, @Param("propertyId") Long propertyId);
}
