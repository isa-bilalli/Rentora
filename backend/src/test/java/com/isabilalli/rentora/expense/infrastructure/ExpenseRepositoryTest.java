package com.isabilalli.rentora.expense.infrastructure;

import com.isabilalli.rentora.expense.domain.Expense;
import com.isabilalli.rentora.expense.domain.ExpenseCategory;
import com.isabilalli.rentora.expense.domain.ExpenseStatus;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

// Derived queries can only be checked against a real database. This runs on the configured PostgreSQL
// database; @DataJpaTest rolls each test back, so nothing it creates is kept.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ExpenseRepositoryTest {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    private Long organizationId;
    private Long propertyId;

    @BeforeEach
    void setUp() {
        organizationId = organizationRepository.save(new Organization("Expense query test")).getId();
        propertyId = propertyRepository.save(
                new Property(organizationId, "Test property", "1 Test Street", "Dublin", null, "Ireland")
        ).getId();
    }

    @Test
    void paidStatusQueryLeavesOutVoidedExpenses() {
        Expense unpaid = saveExpense(false, false);
        Expense paid = saveExpense(true, false);
        saveExpense(false, true);
        saveExpense(true, true);

        assertEquals(
                List.of(unpaid.getId()),
                ids(expenseRepository.findAllByOrganizationIdAndPaidAndStatus(organizationId, false, ExpenseStatus.RECORDED))
        );
        assertEquals(
                List.of(paid.getId()),
                ids(expenseRepository.findAllByOrganizationIdAndPaidAndStatus(organizationId, true, ExpenseStatus.RECORDED))
        );
    }

    private Expense saveExpense(boolean paid, boolean voided) {
        Expense expense = new Expense(
                organizationId, propertyId, null, ExpenseCategory.OTHER, null, null,
                10_000L, LocalDate.of(2026, 10, 1), null
        );
        if (paid) {
            expense.markPaid();
        }
        if (voided) {
            expense.voidExpense();
        }
        return expenseRepository.save(expense);
    }

    private List<Long> ids(List<Expense> expenses) {
        return expenses.stream().map(Expense::getId).sorted().toList();
    }
}
