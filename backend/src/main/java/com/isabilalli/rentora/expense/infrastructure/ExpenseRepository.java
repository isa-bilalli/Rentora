package com.isabilalli.rentora.expense.infrastructure;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.isabilalli.rentora.expense.domain.Expense;
import com.isabilalli.rentora.expense.domain.ExpenseStatus;

public interface ExpenseRepository extends JpaRepository<Expense, Long>{
    List<Expense> findAllByOrganizationId(Long organizationId);
    List<Expense> findAllByPropertyId(Long propertyId);
    // Spring Data builds this query from the method name, so every filter must appear in it.
    List<Expense> findAllByOrganizationIdAndPaidAndStatus(Long organizationId, boolean paid, ExpenseStatus status);

    // A page of the Expenses page, with the property's and space's names. propertyId and status are skipped when
    // null; onlyPaid and onlyUnpaid narrow recorded expenses to the paid or unpaid ones, which is how the page's
    // PAID and UNPAID states differ. The Pageable sets the order.
    @Query(value = """
        SELECT new com.isabilalli.rentora.expense.infrastructure.ExpenseListRow(e, p.name, s.name)
        FROM Expense e
        JOIN Property p ON p.id = e.propertyId
        LEFT JOIN Space s ON s.id = e.spaceId
        WHERE e.organizationId = :organizationId
          AND (:propertyId IS NULL OR e.propertyId = :propertyId)
          AND (:status IS NULL OR e.status = :status)
          AND (:onlyPaid = false OR e.paid = true)
          AND (:onlyUnpaid = false OR e.paid = false)
        """, countQuery = """
        SELECT COUNT(e)
        FROM Expense e
        JOIN Property p ON p.id = e.propertyId
        LEFT JOIN Space s ON s.id = e.spaceId
        WHERE e.organizationId = :organizationId
          AND (:propertyId IS NULL OR e.propertyId = :propertyId)
          AND (:status IS NULL OR e.status = :status)
          AND (:onlyPaid = false OR e.paid = true)
          AND (:onlyUnpaid = false OR e.paid = false)
        """)
    Page<ExpenseListRow> findListPage(
            @Param("organizationId") Long organizationId,
            @Param("propertyId") Long propertyId,
            @Param("status") ExpenseStatus status,
            @Param("onlyPaid") boolean onlyPaid,
            @Param("onlyUnpaid") boolean onlyUnpaid,
            Pageable pageable);

    interface StateTotal {
        String getState();
        Long getProperty();
        long getExpenses();
        long getCents();
    }

    // Count and sum per state and property, the states as the Expenses page shows them.
    @Query(value = """
        SELECT CASE WHEN e.status = 'VOIDED' THEN 'VOIDED' WHEN e.paid THEN 'PAID' ELSE 'UNPAID' END AS state,
               e.property_id AS property,
               COUNT(*) AS expenses,
               CAST(COALESCE(SUM(e.amount_cents), 0) AS BIGINT) AS cents
        FROM expenses e
        WHERE e.organization_id = :organizationId
        GROUP BY 1, 2
        """, nativeQuery = true)
    List<StateTotal> totalsByStateAndProperty(@Param("organizationId") Long organizationId);
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
