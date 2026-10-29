package com.isabilalli.rentora.expense.application;

import com.isabilalli.rentora.TestcontainersConfiguration;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.expense.api.dto.ExpenseListItem;
import com.isabilalli.rentora.expense.api.dto.ExpenseSortField;
import com.isabilalli.rentora.expense.api.dto.ExpenseState;
import com.isabilalli.rentora.expense.api.dto.ExpenseStateTotal;
import com.isabilalli.rentora.expense.domain.Expense;
import com.isabilalli.rentora.expense.domain.ExpenseCategory;
import com.isabilalli.rentora.expense.infrastructure.ExpenseRepository;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.property.api.PropertyAccess;
import com.isabilalli.rentora.property.api.SpaceAccess;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;
import com.isabilalli.rentora.shared.api.PageResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;

// The Expenses page's queries, on the throwaway PostgreSQL from TestcontainersConfiguration. @DataJpaTest also
// rolls each test back. Another organization has an expense too, which must never show up.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class ExpensePagingTest {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private SpaceRepository spaceRepository;

    private ExpenseService expenseService;
    private Long organizationId;
    private Long harbourView;
    private Long marketSquare;

    // Newest first: voidedAfterPaying (20 Mar), voided (1 Mar), unpaidSameDay and paid (both 5 Feb; the later one
    // recorded first), unpaid (10 Jan).
    private Expense unpaid;
    private Expense paid;
    private Expense unpaidSameDay;
    private Expense voided;
    private Expense voidedAfterPaying;

    @BeforeEach
    void setUp() {
        // Access checks are covered by AccessRulesApiTest; here they let every call through.
        expenseService = new ExpenseService(expenseRepository, mock(CurrentUserService.class),
                mock(OrganizationAccessService.class), mock(PropertyAccess.class), mock(SpaceAccess.class));

        organizationId = organizationRepository.save(new Organization("Expense paging test")).getId();
        harbourView = property(organizationId, "Harbour View");
        Long unitA = space(harbourView, "Unit A");
        marketSquare = property(organizationId, "Market Square");

        unpaid = record(organizationId, harbourView, unitA, "2026-01-10", 10_000);
        paid = record(organizationId, harbourView, null, "2026-02-05", 30_000);
        paid.markPaid();
        unpaidSameDay = record(organizationId, marketSquare, null, "2026-02-05", 30_000);
        voided = record(organizationId, marketSquare, null, "2026-03-01", 5_000);
        voided.voidExpense();
        voidedAfterPaying = record(organizationId, harbourView, unitA, "2026-03-20", 20_000);
        voidedAfterPaying.markPaid();
        voidedAfterPaying.voidExpense();
        expenseRepository.saveAllAndFlush(List.of(paid, voided, voidedAfterPaying));

        Long otherOrganization = organizationRepository.save(new Organization("Someone else")).getId();
        record(otherOrganization, property(otherOrganization, "Harbour View"), null, "2026-03-25", 99_000);
    }

    @Test
    void pagesNewestExpenseFirst() {
        PageResponse<ExpenseListItem> first = page(null, null, 0, 2, null, null);
        PageResponse<ExpenseListItem> second = page(null, null, 1, 2, null, null);
        PageResponse<ExpenseListItem> third = page(null, null, 2, 2, null, null);

        assertEquals(ids(voidedAfterPaying, voided), ids(first));
        assertEquals(ids(unpaidSameDay, paid), ids(second));
        assertEquals(ids(unpaid), ids(third));
        assertEquals(5, first.totalItems());
    }

    // A paid expense that was voided counts as voided.
    @Test
    void filtersByStatePropertyOrBoth() {
        assertEquals(ids(unpaidSameDay, unpaid), ids(page(ExpenseState.UNPAID, null)));
        assertEquals(ids(paid), ids(page(ExpenseState.PAID, null)));
        assertEquals(ids(voidedAfterPaying, voided), ids(page(ExpenseState.VOIDED, null)));
        assertEquals(ids(voidedAfterPaying, paid, unpaid), ids(page(null, harbourView)));
        assertEquals(ids(unpaid), ids(page(ExpenseState.UNPAID, harbourView)));
    }

    // 300.00 is shared by unpaidSameDay and paid; the newer one comes first either way.
    @Test
    void sortsByAmountWithTiesNewestFirst() {
        assertEquals(ids(unpaidSameDay, paid, voidedAfterPaying, unpaid, voided),
                ids(page(null, null, 0, 25, ExpenseSortField.AMOUNT, Sort.Direction.DESC)));
        assertEquals(ids(voided, unpaid, voidedAfterPaying, unpaidSameDay, paid),
                ids(page(null, null, 0, 25, ExpenseSortField.AMOUNT, Sort.Direction.ASC)));
    }

    @Test
    void sortsByDateEarliestFirst() {
        assertEquals(ids(unpaid, unpaidSameDay, paid, voided, voidedAfterPaying),
                ids(page(null, null, 0, 25, ExpenseSortField.DATE, Sort.Direction.ASC)));
    }

    @Test
    void rowsCarryTheStateAndNames() {
        ExpenseListItem withSpace = page(ExpenseState.UNPAID, harbourView).items().getFirst();
        ExpenseListItem wholeProperty = page(ExpenseState.VOIDED, marketSquare).items().getFirst();

        assertEquals(ExpenseState.UNPAID, withSpace.state());
        assertEquals("Harbour View", withSpace.propertyName());
        assertEquals("Unit A", withSpace.spaceName());
        assertEquals(ExpenseState.VOIDED, wholeProperty.state());
        assertEquals("Market Square", wholeProperty.propertyName());
        assertNull(wholeProperty.spaceName());
    }

    @Test
    void summaryCountsAndAddsUpEachStateAndPropertyOfThisOrganizationOnly() {
        Set<ExpenseStateTotal> expected = Set.of(
                new ExpenseStateTotal(ExpenseState.UNPAID, harbourView, 1, 10_000),
                new ExpenseStateTotal(ExpenseState.PAID, harbourView, 1, 30_000),
                new ExpenseStateTotal(ExpenseState.VOIDED, harbourView, 1, 20_000),
                new ExpenseStateTotal(ExpenseState.UNPAID, marketSquare, 1, 30_000),
                new ExpenseStateTotal(ExpenseState.VOIDED, marketSquare, 1, 5_000));

        assertEquals(expected, new HashSet<>(expenseService.getExpenseSummary(organizationId)));
    }

    private PageResponse<ExpenseListItem> page(ExpenseState state, Long propertyId) {
        return page(state, propertyId, 0, 25, null, null);
    }

    private PageResponse<ExpenseListItem> page(ExpenseState state, Long propertyId, int page, int size, ExpenseSortField sort, Sort.Direction direction) {
        return expenseService.getExpensePage(organizationId, state, propertyId, page, size, sort, direction);
    }

    private Long property(Long owner, String name) {
        return propertyRepository.save(new Property(owner, name, "1 Test Street", "Dublin", null, "Ireland")).getId();
    }

    private Long space(Long propertyId, String name) {
        return spaceRepository.save(new Space(propertyId, name, SpaceType.RESIDENTIAL, 1, new BigDecimal("50.00"), SpaceStatus.VACANT)).getId();
    }

    private Expense record(Long owner, Long propertyId, Long spaceId, String date, long amountCents) {
        return expenseRepository.saveAndFlush(new Expense(owner, propertyId, spaceId, ExpenseCategory.CLEANING, null, null,
                amountCents, LocalDate.parse(date), null));
    }

    private static List<Long> ids(Expense... expenses) {
        return Arrays.stream(expenses).map(Expense::getId).toList();
    }

    private static List<Long> ids(PageResponse<ExpenseListItem> page) {
        return page.items().stream().map(item -> item.expense().id()).toList();
    }
}
