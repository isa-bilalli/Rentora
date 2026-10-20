package com.isabilalli.rentora.reporting.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.expense.api.ExpenseAccess;
import com.isabilalli.rentora.lease.api.LeaseAccess;
import com.isabilalli.rentora.maintenance.api.MaintenanceAccess;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.payment.api.PaymentAccess;
import com.isabilalli.rentora.property.api.PropertyAccess;
import com.isabilalli.rentora.property.api.SpaceAccess;
import com.isabilalli.rentora.reporting.api.dto.FinancialReportRequest;
import com.isabilalli.rentora.reporting.api.dto.FinancialReportResponse;
import com.isabilalli.rentora.reporting.domain.ReportingPeriod;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportingServiceTest {

    // The signed-in user belongs to this organization only.
    private static final Long MEMBER_ORGANIZATION_ID = 2L;
    private static final Long OTHER_ORGANIZATION_ID = 1L;

    private static final FinancialReportRequest OCTOBER =
            new FinancialReportRequest(ReportingPeriod.MONTH, LocalDate.of(2026, 10, 20), null, null, null);

    @Mock private CurrentUserService currentUserService;
    @Mock private OrganizationAccessService organizationAccessService;
    @Mock private PaymentAccess paymentAccess;
    @Mock private ExpenseAccess expenseAccess;
    @Mock private PropertyAccess propertyAccess;
    @Mock private SpaceAccess spaceAccess;
    @Mock private LeaseAccess leaseAccess;
    @Mock private MaintenanceAccess maintenanceAccess;
    @Mock private AuthenticatedUser user;

    private ReportingService reportingService;

    @BeforeEach
    void setUp() {
        reportingService = new ReportingService(
                currentUserService, organizationAccessService, new ReportRangeResolver(),
                paymentAccess, expenseAccess, propertyAccess, spaceAccess, leaseAccess, maintenanceAccess
        );
        when(currentUserService.getCurrentUser()).thenReturn(user);
        doAnswer(invocation -> {
            if (!MEMBER_ORGANIZATION_ID.equals(invocation.getArgument(1))) {
                throw new AccessDeniedException("User does not have access to this organization");
            }
            return null;
        }).when(organizationAccessService).requireAccess(any(), any());
    }

    // Property 2 belongs to the other organization; its ID happens to equal the user's organization ID.
    // Checking membership against the property ID would let this through.
    @Test
    void propertyReportIsRefusedForAnOrganizationTheUserDoesNotBelongTo() {
        assertThrows(
                AccessDeniedException.class,
                () -> reportingService.getPropertyFinancialReport(OTHER_ORGANIZATION_ID, 2L, OCTOBER)
        );

        verifyNoInteractions(paymentAccess, expenseAccess);
    }

    @Test
    void propertyReportWorksForAPropertyOfTheUsersOrganization() {
        Long propertyId = 4L;
        when(paymentAccess.sumExpectedRent(eq(MEMBER_ORGANIZATION_ID), any(), any(), eq(propertyId))).thenReturn(100_000L);
        when(paymentAccess.sumPaidRent(eq(MEMBER_ORGANIZATION_ID), any(), any(), eq(propertyId))).thenReturn(25_000L);

        FinancialReportResponse report = reportingService.getPropertyFinancialReport(MEMBER_ORGANIZATION_ID, propertyId, OCTOBER);

        verify(organizationAccessService).requireAccess(user, MEMBER_ORGANIZATION_ID);
        verify(propertyAccess).requireBelongsToOrganization(propertyId, MEMBER_ORGANIZATION_ID);
        assertEquals(100_000L, report.expectedRentCents());
        assertEquals(25_000L, report.collectedRentCents());
        assertEquals(25.0, report.collectionRate());
    }
}
