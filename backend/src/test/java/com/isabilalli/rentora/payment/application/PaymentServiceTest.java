package com.isabilalli.rentora.payment.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.lease.api.LeaseAccess;
import com.isabilalli.rentora.lease.api.event.LeaseCancelledEvent;
import com.isabilalli.rentora.lease.api.event.LeaseEndedEvent;
import com.isabilalli.rentora.lease.api.event.LeaseUpdatedEvent;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
import com.isabilalli.rentora.payment.api.dto.PaymentDisplayStatus;
import com.isabilalli.rentora.payment.domain.Payment;
import com.isabilalli.rentora.payment.domain.PaymentMethod;
import com.isabilalli.rentora.payment.domain.PaymentStatus;
import com.isabilalli.rentora.payment.infrastructure.PaymentRepository;
import com.isabilalli.rentora.shared.api.BadRequestException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    private static final Long ORGANIZATION_ID = 1L;
    private static final Long LEASE_ID = 50L;
    private static final Long RENT = 1_000_00L;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private LeaseAccess leaseAccess;

    @Mock
    private AuthenticatedUser authenticatedUser;

    @Captor
    private ArgumentCaptor<List<Payment>> paymentsCaptor;

    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        paymentService = new PaymentService(
                paymentRepository,
                currentUserService,
                organizationAccessService,
                leaseAccess
        );
    }

    @Test
    void statusQueryIsScopedToTheOrganization() {
        when(currentUserService.getCurrentUser()).thenReturn(authenticatedUser);
        when(paymentRepository.findAllByOrganizationIdAndStatus(ORGANIZATION_ID, PaymentStatus.PENDING))
                .thenReturn(List.of());

        paymentService.getByStatus(ORGANIZATION_ID, PaymentStatus.PENDING);

        verify(organizationAccessService).requireAccess(authenticatedUser, ORGANIZATION_ID);
        verify(paymentRepository).findAllByOrganizationIdAndStatus(ORGANIZATION_ID, PaymentStatus.PENDING);
    }

    // Voiding needs a manager or owner (docs/ROLES.md); a member is stopped before the payment is touched.
    @Test
    void memberCannotVoidAPayment() {
        when(currentUserService.getCurrentUser()).thenReturn(authenticatedUser);
        doThrow(new AccessDeniedException("Your role in this organization does not allow this action"))
                .when(organizationAccessService).requireRole(authenticatedUser, ORGANIZATION_ID, OrganizationRole.MANAGER);

        assertThrows(AccessDeniedException.class, () -> paymentService.voidPayment(ORGANIZATION_ID, 1L));

        verifyNoInteractions(paymentRepository);
    }

    @Test
    void pageAndSizeMustBeInRange() {
        assertThrows(BadRequestException.class, () -> paymentService.getPaymentPage(ORGANIZATION_ID, PaymentDisplayStatus.PAID, -1, 25));
        assertThrows(BadRequestException.class, () -> paymentService.getPaymentPage(ORGANIZATION_ID, PaymentDisplayStatus.PAID, 0, 0));
        assertThrows(BadRequestException.class, () -> paymentService.getPaymentPage(ORGANIZATION_ID, PaymentDisplayStatus.PAID, 0, PaymentService.MAX_PAGE_SIZE + 1));

        verifyNoInteractions(paymentRepository);
    }

    @Test
    void clampsDueDayToShortMonths() {
        when(paymentRepository.findAllByLeaseId(LEASE_ID)).thenReturn(List.of());

        paymentService.generateRentObligations(
                ORGANIZATION_ID,
                LEASE_ID,
                LocalDate.of(2030, 1, 31),
                LocalDate.of(2030, 3, 30),
                RENT
        );

        verify(paymentRepository).saveAll(paymentsCaptor.capture());
        assertEquals(
                Set.of(LocalDate.of(2030, 1, 31), LocalDate.of(2030, 2, 28)),
                dueDates(paymentsCaptor.getValue())
        );
    }

    @Test
    void shorteningLeaseDeletesPendingRentBeyondNewEndAndKeepsPaidRent() {
        Payment january = paid(LocalDate.of(2030, 1, 10));
        Payment february = pending(LocalDate.of(2030, 2, 10));
        Payment march = pending(LocalDate.of(2030, 3, 10));
        Payment april = pending(LocalDate.of(2030, 4, 10));
        Payment mayPaid = paid(LocalDate.of(2030, 5, 10));
        when(paymentRepository.findAllByLeaseId(LEASE_ID))
                .thenReturn(List.of(january, february, march, april, mayPaid));

        paymentService.handleLeaseUpdated(updated(LocalDate.of(2030, 1, 10), LocalDate.of(2030, 3, 31), RENT));

        verify(paymentRepository).deleteAll(List.of(april));
        assertEquals(PaymentStatus.PAID, mayPaid.getStatus());
        verify(paymentRepository, times(2)).saveAll(paymentsCaptor.capture());
        assertTrue(paymentsCaptor.getAllValues().get(1).isEmpty());
    }

    @Test
    void extendingLeaseAddsMissingMonths() {
        when(paymentRepository.findAllByLeaseId(LEASE_ID)).thenReturn(List.of(
                pending(LocalDate.of(2030, 1, 10)),
                pending(LocalDate.of(2030, 2, 10))
        ));

        paymentService.handleLeaseUpdated(updated(LocalDate.of(2030, 1, 10), LocalDate.of(2030, 4, 30), RENT));

        verify(paymentRepository, times(2)).saveAll(paymentsCaptor.capture());
        List<Payment> added = paymentsCaptor.getAllValues().get(1);
        assertEquals(Set.of(LocalDate.of(2030, 3, 10), LocalDate.of(2030, 4, 10)), dueDates(added));
        added.forEach(payment -> assertEquals(RENT, payment.getAmountCents()));
    }

    @Test
    void movingStartDayReplacesPendingRentOnTheOldDay() {
        Payment oldJanuary = pending(LocalDate.of(2030, 1, 10));
        Payment oldFebruary = pending(LocalDate.of(2030, 2, 10));
        when(paymentRepository.findAllByLeaseId(LEASE_ID)).thenReturn(List.of(oldJanuary, oldFebruary));

        paymentService.handleLeaseUpdated(updated(LocalDate.of(2030, 1, 15), LocalDate.of(2030, 2, 28), RENT));

        verify(paymentRepository).deleteAll(List.of(oldJanuary, oldFebruary));
        verify(paymentRepository, times(2)).saveAll(paymentsCaptor.capture());
        assertEquals(
                Set.of(LocalDate.of(2030, 1, 15), LocalDate.of(2030, 2, 15)),
                dueDates(paymentsCaptor.getAllValues().get(1))
        );
    }

    @Test
    void rentChangeAppliesOnlyToRentNotYetDue() {
        LocalDate today = LocalDate.now();
        LocalDate lastMonth = today.minusMonths(1).withDayOfMonth(1);
        LocalDate nextMonth = today.plusMonths(1).withDayOfMonth(1);
        Payment pastDue = pending(lastMonth);
        Payment upcoming = pending(nextMonth);
        when(paymentRepository.findAllByLeaseId(LEASE_ID)).thenReturn(List.of(pastDue, upcoming));

        paymentService.handleLeaseUpdated(updated(lastMonth, nextMonth.plusDays(20), 1_200_00L));

        assertEquals(RENT, pastDue.getAmountCents());
        assertEquals(1_200_00L, upcoming.getAmountCents());
    }

    @Test
    void cancellingLeaseVoidsAllPendingRent() {
        Payment first = pending(LocalDate.of(2030, 1, 10));
        Payment second = pending(LocalDate.of(2030, 2, 10));
        when(paymentRepository.findAllByLeaseIdAndStatus(LEASE_ID, PaymentStatus.PENDING))
                .thenReturn(List.of(first, second));

        paymentService.handleLeaseCancelled(new LeaseCancelledEvent(LEASE_ID));

        assertEquals(PaymentStatus.VOIDED, first.getStatus());
        assertEquals(PaymentStatus.VOIDED, second.getStatus());
        verify(paymentRepository).saveAll(List.of(first, second));
    }

    @Test
    void endingLeaseVoidsOnlyPendingRentAfterLastDay() {
        LocalDate lastDay = LocalDate.of(2030, 3, 20);
        Payment afterEnd = pending(LocalDate.of(2030, 4, 10));
        when(paymentRepository.findAllByLeaseIdAndStatusAndDueDateAfter(LEASE_ID, PaymentStatus.PENDING, lastDay))
                .thenReturn(List.of(afterEnd));

        paymentService.handleLeaseEnded(new LeaseEndedEvent(LEASE_ID, lastDay));

        assertEquals(PaymentStatus.VOIDED, afterEnd.getStatus());
        verify(paymentRepository).saveAll(List.of(afterEnd));
    }

    private LeaseUpdatedEvent updated(LocalDate startDate, LocalDate endDate, Long rent) {
        return new LeaseUpdatedEvent(ORGANIZATION_ID, LEASE_ID, startDate, endDate, rent);
    }

    private Payment pending(LocalDate dueDate) {
        return new Payment(ORGANIZATION_ID, LEASE_ID, dueDate, RENT);
    }

    private Payment paid(LocalDate dueDate) {
        Payment payment = pending(dueDate);
        payment.markPaid(OffsetDateTime.now(), PaymentMethod.values()[0], 1L);
        return payment;
    }

    private Set<LocalDate> dueDates(List<Payment> payments) {
        return payments.stream().map(Payment::getDueDate).collect(Collectors.toSet());
    }
}
