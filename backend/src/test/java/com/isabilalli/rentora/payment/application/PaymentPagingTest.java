package com.isabilalli.rentora.payment.application;

import com.isabilalli.rentora.TestcontainersConfiguration;
import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.lease.api.LeaseAccess;
import com.isabilalli.rentora.lease.domain.Lease;
import com.isabilalli.rentora.lease.infrastructure.LeaseRepository;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.payment.api.dto.PaymentDisplayStatus;
import com.isabilalli.rentora.payment.api.dto.PaymentListItem;
import com.isabilalli.rentora.payment.api.dto.PaymentSortField;
import com.isabilalli.rentora.payment.api.dto.PaymentStatusTotal;
import com.isabilalli.rentora.payment.domain.Payment;
import com.isabilalli.rentora.payment.domain.PaymentMethod;
import com.isabilalli.rentora.payment.infrastructure.PaymentRepository;
import com.isabilalli.rentora.property.domain.Property;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;
import com.isabilalli.rentora.shared.api.PageResponse;
import com.isabilalli.rentora.tenant.domain.Tenant;
import com.isabilalli.rentora.tenant.domain.TenantType;
import com.isabilalli.rentora.tenant.infrastructure.TenantRepository;

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
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

// The Payments page's tabs, read through the real queries on the throwaway PostgreSQL from
// TestcontainersConfiguration. @DataJpaTest also rolls each test back.
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
class PaymentPagingTest {

    private static final LocalDate TODAY = LocalDate.now();

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private SpaceRepository spaceRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private LeaseRepository leaseRepository;

    private PaymentService paymentService;
    private Long organizationId;
    private Long leaseId;

    @BeforeEach
    void setUp() {
        // Access checks are covered elsewhere; here they let every call through.
        paymentService = new PaymentService(paymentRepository, mock(CurrentUserService.class), mock(OrganizationAccessService.class), mock(LeaseAccess.class));

        organizationId = organizationRepository.save(new Organization("Payment paging test")).getId();
        Long propertyId = propertyRepository.save(
                new Property(organizationId, "Test property", "1 Test Street", "Dublin", null, "Ireland")
        ).getId();
        Long spaceId = spaceRepository.save(
                new Space(propertyId, "Unit 1", SpaceType.RESIDENTIAL, 1, new BigDecimal("50.00"), SpaceStatus.OCCUPIED)
        ).getId();
        Long tenantId = tenantRepository.save(
                new Tenant(organizationId, TenantType.INDIVIDUAL, "Test", "Tenant", null, null, null)
        ).getId();
        leaseId = leaseRepository.save(
                new Lease(organizationId, tenantId, spaceId, TODAY.minusYears(1), TODAY.plusYears(1), 100_00L, 0L)
        ).getId();
    }

    @Test
    void overdueTabPagesOldestDueFirst() {
        Payment fiveDaysLate = pending(TODAY.minusDays(5), 300);
        Payment fortyDaysLate = pending(TODAY.minusDays(40), 100);
        Payment tenDaysLate = pending(TODAY.minusDays(10), 200);
        pending(TODAY, 999);

        PageResponse<PaymentListItem> first = page(PaymentDisplayStatus.OVERDUE, 0, 2);
        PageResponse<PaymentListItem> second = page(PaymentDisplayStatus.OVERDUE, 1, 2);

        assertEquals(List.of(fortyDaysLate.getId(), tenDaysLate.getId()), ids(first));
        assertEquals(3, first.totalItems());
        assertEquals(2, first.totalPages());
        assertEquals(List.of(fiveDaysLate.getId()), ids(second));
    }

    // Due today is not overdue yet, as on the page before.
    @Test
    void pendingTabStartsWithPaymentsDueToday() {
        Payment nextMonth = pending(TODAY.plusMonths(1), 100);
        Payment dueToday = pending(TODAY, 100);
        pending(TODAY.minusDays(1), 100);

        PageResponse<PaymentListItem> page = page(PaymentDisplayStatus.PENDING, 0, 25);

        assertEquals(List.of(dueToday.getId(), nextMonth.getId()), ids(page));
    }

    @Test
    void paidTabShowsTheLatestPaymentFirst() {
        Payment paidLastWeek = paid(TODAY.minusMonths(2), OffsetDateTime.now().minusDays(7));
        Payment paidYesterday = paid(TODAY.minusMonths(1), OffsetDateTime.now().minusDays(1));

        PageResponse<PaymentListItem> page = page(PaymentDisplayStatus.PAID, 0, 25);

        assertEquals(List.of(paidYesterday.getId(), paidLastWeek.getId()), ids(page));
    }

    // Two 200s tie, so the tab's own order (oldest due first) decides between them, the same on every page.
    @Test
    void sortsATabByAmountAcrossPagesWithTiesInTheTabsOrder() {
        Payment fiveDaysLate = pending(TODAY.minusDays(5), 300);
        Payment fortyDaysLate = pending(TODAY.minusDays(40), 100);
        Payment tenDaysLate = pending(TODAY.minusDays(10), 200);
        Payment twentyDaysLate = pending(TODAY.minusDays(20), 200);

        PageResponse<PaymentListItem> first = sortedPage(PaymentDisplayStatus.OVERDUE, PaymentSortField.AMOUNT, Sort.Direction.DESC, 0, 2);
        PageResponse<PaymentListItem> second = sortedPage(PaymentDisplayStatus.OVERDUE, PaymentSortField.AMOUNT, Sort.Direction.DESC, 1, 2);
        PageResponse<PaymentListItem> ascending = sortedPage(PaymentDisplayStatus.OVERDUE, PaymentSortField.AMOUNT, Sort.Direction.ASC, 0, 25);

        assertEquals(List.of(fiveDaysLate.getId(), twentyDaysLate.getId()), ids(first));
        assertEquals(List.of(tenDaysLate.getId(), fortyDaysLate.getId()), ids(second));
        assertEquals(List.of(fortyDaysLate.getId(), twentyDaysLate.getId(), tenDaysLate.getId(), fiveDaysLate.getId()), ids(ascending));
    }

    @Test
    void sortsATabByDueDateLatestFirst() {
        Payment fortyDaysLate = pending(TODAY.minusDays(40), 100);
        Payment fiveDaysLate = pending(TODAY.minusDays(5), 100);
        Payment tenDaysLate = pending(TODAY.minusDays(10), 100);

        PageResponse<PaymentListItem> page = sortedPage(PaymentDisplayStatus.OVERDUE, PaymentSortField.DUE_DATE, Sort.Direction.DESC, 0, 25);

        assertEquals(List.of(fiveDaysLate.getId(), tenDaysLate.getId(), fortyDaysLate.getId()), ids(page));
    }

    @Test
    void sortsThePaidTabByWhenPaidEarliestFirst() {
        Payment paidYesterday = paid(TODAY.minusMonths(1), OffsetDateTime.now().minusDays(1));
        Payment paidLastWeek = paid(TODAY.minusMonths(2), OffsetDateTime.now().minusDays(7));

        PageResponse<PaymentListItem> page = sortedPage(PaymentDisplayStatus.PAID, PaymentSortField.PAID_AT, Sort.Direction.ASC, 0, 25);

        assertEquals(List.of(paidLastWeek.getId(), paidYesterday.getId()), ids(page));
    }

    @Test
    void rowsCarryTheTenantPropertyAndSpaceNames() {
        pending(TODAY.plusDays(3), 100);

        PaymentListItem row = page(PaymentDisplayStatus.PENDING, 0, 25).items().getFirst();

        assertEquals("Test Tenant", row.tenantName());
        assertEquals("Test property", row.propertyName());
        assertEquals("Unit 1", row.spaceName());
    }

    @Test
    void summaryCountsAndAddsUpEveryTab() {
        pending(TODAY.minusDays(10), 100);
        pending(TODAY.minusDays(3), 250);
        pending(TODAY.plusDays(3), 400);
        paid(TODAY.minusMonths(1), OffsetDateTime.now());
        Payment voided = pending(TODAY.plusMonths(2), 700);
        voided.voidPayment();
        paymentRepository.saveAndFlush(voided);

        Map<PaymentDisplayStatus, PaymentStatusTotal> summary = paymentService.getPaymentSummary(organizationId);

        assertEquals(new PaymentStatusTotal(2, 350), summary.get(PaymentDisplayStatus.OVERDUE));
        assertEquals(new PaymentStatusTotal(1, 400), summary.get(PaymentDisplayStatus.PENDING));
        assertEquals(new PaymentStatusTotal(1, 500), summary.get(PaymentDisplayStatus.PAID));
        assertEquals(new PaymentStatusTotal(1, 700), summary.get(PaymentDisplayStatus.VOIDED));
    }

    @Test
    void summaryOfAnOrganizationWithoutPaymentsIsAllZeros() {
        Map<PaymentDisplayStatus, PaymentStatusTotal> summary = paymentService.getPaymentSummary(organizationId);

        for (PaymentDisplayStatus status : PaymentDisplayStatus.values()) {
            assertEquals(new PaymentStatusTotal(0, 0), summary.get(status));
        }
    }

    private PageResponse<PaymentListItem> page(PaymentDisplayStatus status, int page, int size) {
        return paymentService.getPaymentPage(organizationId, status, page, size, null, null);
    }

    private PageResponse<PaymentListItem> sortedPage(PaymentDisplayStatus status, PaymentSortField sort, Sort.Direction direction, int page, int size) {
        return paymentService.getPaymentPage(organizationId, status, page, size, sort, direction);
    }

    private Payment pending(LocalDate dueDate, long amountCents) {
        return paymentRepository.saveAndFlush(new Payment(organizationId, leaseId, dueDate, amountCents));
    }

    private Payment paid(LocalDate dueDate, OffsetDateTime paidAt) {
        Payment payment = new Payment(organizationId, leaseId, dueDate, 500L);
        payment.markPaid(paidAt, PaymentMethod.BANK_TRANSFER, null);
        return paymentRepository.saveAndFlush(payment);
    }

    private static List<Long> ids(PageResponse<PaymentListItem> page) {
        return page.items().stream().map(item -> item.payment().id()).toList();
    }
}
