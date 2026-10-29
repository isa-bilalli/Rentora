package com.isabilalli.rentora.payment.application;

import com.isabilalli.rentora.shared.api.BadRequestException;
import com.isabilalli.rentora.shared.api.NotFoundException;
import com.isabilalli.rentora.shared.api.PageResponse;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.isabilalli.rentora.lease.api.event.LeaseCancelledEvent;
import com.isabilalli.rentora.lease.api.event.LeaseCreatedEvent;
import com.isabilalli.rentora.lease.api.event.LeaseEndedEvent;
import com.isabilalli.rentora.lease.api.event.LeaseUpdatedEvent;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.lease.api.LeaseAccess;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
import com.isabilalli.rentora.payment.api.PaymentAccess;
import com.isabilalli.rentora.payment.api.dto.PaymentDisplayStatus;
import com.isabilalli.rentora.payment.api.dto.PaymentResponse;
import com.isabilalli.rentora.payment.api.dto.PaymentSortField;
import com.isabilalli.rentora.payment.api.dto.PaymentStatusTotal;
import com.isabilalli.rentora.payment.api.dto.RecordPaymentRequest;
import com.isabilalli.rentora.payment.domain.Payment;
import com.isabilalli.rentora.payment.domain.PaymentStatus;
import com.isabilalli.rentora.payment.infrastructure.PaymentRepository;

@Service 
public class PaymentService implements PaymentAccess {
    private final PaymentRepository paymentRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;
    private final LeaseAccess leaseAccess;

    public PaymentService(PaymentRepository paymentRepository, CurrentUserService currentUserService, OrganizationAccessService organizationAccessService, LeaseAccess leaseAccess){
        this.paymentRepository=paymentRepository;
        this.currentUserService=currentUserService;
        this.organizationAccessService=organizationAccessService;
        this.leaseAccess=leaseAccess;
    }

    public PaymentResponse getPayment(Long organizationId, Long paymentId){
        organizationAuthorization(organizationId);
        Payment payment=validatePayment(paymentId, organizationId);
        return PaymentResponse.from(payment);
    }

    public PaymentResponse recordPayment(Long organizationId, Long paymentId, RecordPaymentRequest request){
        AuthenticatedUser currentUser = organizationAuthorization(organizationId);
        Payment payment = validatePayment(paymentId, organizationId);
        
        payment.markPaid(request.paidAt(), request.paymentMethod(), currentUser.userId());
        Payment savedPayment = paymentRepository.save(payment);
        return PaymentResponse.from(savedPayment);
    }

    public PaymentResponse voidPayment(Long organizationId, Long paymentId){
        organizationAccessService.requireRole(currentUserService.getCurrentUser(), organizationId, OrganizationRole.MANAGER);
        Payment payment = validatePayment(paymentId, organizationId);
        payment.voidPayment();
        Payment savedPayment = paymentRepository.save(payment);
        return PaymentResponse.from(savedPayment);
    }

    public List<PaymentResponse> getOverduePayments(Long organizationId){
        organizationAuthorization(organizationId);
        return paymentRepository.findAllByOrganizationIdAndStatusAndDueDateBefore(organizationId, PaymentStatus.PENDING, LocalDate.now()).stream().map(PaymentResponse::from).toList();
    }

    public static final int MAX_PAGE_SIZE = 100;

    // One page of a Payments tab. Without a sort, most urgent first: soonest due while unpaid, latest first once
    // paid or voided. With one, by that column, and ties in the tab's own order so rows don't move between pages.
    public PageResponse<PaymentResponse> getPaymentPage(Long organizationId, PaymentDisplayStatus status, int page, int size, PaymentSortField sort, Sort.Direction direction) {
        organizationAuthorization(organizationId);
        if (page < 0) {
            throw new BadRequestException("Page must be 0 or more");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new BadRequestException("Page size must be between 1 and " + MAX_PAGE_SIZE);
        }

        LocalDate today = LocalDate.now();
        Sort tabOrder = switch (status) {
            case OVERDUE, PENDING -> Sort.by(Payment::getDueDate, Payment::getId);
            case PAID -> Sort.by(Payment::getPaidAt, Payment::getId).descending();
            case VOIDED -> Sort.by(Payment::getDueDate, Payment::getId).descending();
        };
        PageRequest pageRequest = PageRequest.of(page, size, sort == null ? tabOrder : columnOrder(sort, direction).and(tabOrder));
        Page<Payment> result = switch (status) {
            case OVERDUE -> paymentRepository.findByOrganizationIdAndStatusAndDueDateBefore(
                    organizationId, PaymentStatus.PENDING, today, pageRequest);
            case PENDING -> paymentRepository.findByOrganizationIdAndStatusAndDueDateGreaterThanEqual(
                    organizationId, PaymentStatus.PENDING, today, pageRequest);
            case PAID -> paymentRepository.findByOrganizationIdAndStatus(organizationId, PaymentStatus.PAID, pageRequest);
            case VOIDED -> paymentRepository.findByOrganizationIdAndStatus(organizationId, PaymentStatus.VOIDED, pageRequest);
        };
        return PageResponse.from(result, PaymentResponse::from);
    }

    private static Sort columnOrder(PaymentSortField sort, Sort.Direction direction) {
        Sort column = switch (sort) {
            case DUE_DATE -> Sort.by(Payment::getDueDate);
            case AMOUNT -> Sort.by(Payment::getAmountCents);
            case PAID_AT -> Sort.by(Payment::getPaidAt);
        };
        return direction.isAscending() ? column.ascending() : column.descending();
    }

    // Count and total for every Payments tab, over all of the organization's payments. Empty tabs are zeros.
    public Map<PaymentDisplayStatus, PaymentStatusTotal> getPaymentSummary(Long organizationId) {
        organizationAuthorization(organizationId);
        Map<PaymentDisplayStatus, PaymentStatusTotal> totals = new EnumMap<>(PaymentDisplayStatus.class);
        for (PaymentDisplayStatus status : PaymentDisplayStatus.values()) {
            totals.put(status, new PaymentStatusTotal(0, 0));
        }
        for (PaymentRepository.DisplayStatusTotal row : paymentRepository.totalsByDisplayStatus(organizationId, LocalDate.now())) {
            totals.put(PaymentDisplayStatus.valueOf(row.getBucket()), new PaymentStatusTotal(row.getPayments(), row.getCents()));
        }
        return totals;
    }

    public List<PaymentResponse> getByStatus(Long organizationId, PaymentStatus status){
        organizationAuthorization(organizationId);
        return paymentRepository.findAllByOrganizationIdAndStatus(organizationId, status).stream().map(PaymentResponse::from).toList();
    }

    private AuthenticatedUser organizationAuthorization(Long organizationId){
        AuthenticatedUser currentUser=currentUserService.getCurrentUser();
        organizationAccessService.requireAccess(currentUser, organizationId);
        return currentUser;
    }

    private Payment validatePayment(Long paymentId, Long organizationId){
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new NotFoundException("Payment not found"));
        if (!payment.getOrganizationId().equals(organizationId)) {
            throw new AccessDeniedException("Payment does not belong to this organization");
        }
        return payment;
    }

    public List<PaymentResponse> getAllPaymentsByOrganizationId(Long organizationId){
        organizationAuthorization(organizationId);
        return paymentRepository.findAllByOrganizationId(organizationId).stream().map(PaymentResponse::from).toList();
    }

    // The organization is part of the query, so a property of another organization matches nothing.
    public List<PaymentResponse> getAllPaymentsByPropertyId(Long organizationId, Long propertyId){
        organizationAuthorization(organizationId);
        return paymentRepository.findAllByOrganizationIdAndPropertyId(organizationId, propertyId).stream().map(PaymentResponse::from).toList();
    }

    // As with properties, a tenant of another organization matches nothing.
    public List<PaymentResponse> getAllPaymentsByTenantId(Long organizationId, Long tenantId){
        organizationAuthorization(organizationId);
        return paymentRepository.findAllByOrganizationIdAndTenantId(organizationId, tenantId).stream().map(PaymentResponse::from).toList();
    }

    public List<PaymentResponse> getAllPaymentsByLeaseId(Long organizationId, Long leaseId){
        organizationAuthorization(organizationId);
        leaseAccess.requireBelongsToOrganization(leaseId, organizationId);
        return paymentRepository.findAllByLeaseId(leaseId).stream().map(PaymentResponse::from).toList();
    }


    // Rent is due every month on the lease's start day, clamped to the month's length.
    private Set<LocalDate> rentDueDates(LocalDate startDate, LocalDate endDate){
        Set<LocalDate> dueDates = new LinkedHashSet<>();
        int dueDay = startDate.getDayOfMonth();
        LocalDate month = startDate.withDayOfMonth(1);

        while(!month.isAfter(endDate)){
            int actualDay = Math.min(dueDay, month.lengthOfMonth());
            LocalDate dueDate = month.withDayOfMonth(actualDay);
            if (!dueDate.isBefore(startDate) && !dueDate.isAfter(endDate)) {
                dueDates.add(dueDate);
            }
            month = month.plusMonths(1);
        }
        return dueDates;
    }

    @Override
    public void generateRentObligations(Long organizationId, Long leaseId, LocalDate startDate, LocalDate endDate, Long monthlyRentCents) {
        Set<LocalDate> existingDueDates = paymentRepository.findAllByLeaseId(leaseId).stream().map(Payment::getDueDate).collect(Collectors.toSet());
        List<Payment> payments = new ArrayList<>();

        for (LocalDate dueDate : rentDueDates(startDate, endDate)) {
            if (!existingDueDates.contains(dueDate)) {
                payments.add(new Payment(organizationId, leaseId, dueDate, monthlyRentCents));
            }
        }
        if(!payments.isEmpty()){
            paymentRepository.saveAll(payments);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleLeaseCreated(LeaseCreatedEvent event) {
        generateRentObligations(event.organizationId(), event.leaseId(), event.startDate(), event.endDate(), event.monthlyRentCents());
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleLeaseUpdated(LeaseUpdatedEvent event) {
        Set<LocalDate> schedule = rentDueDates(event.startDate(), event.endDate());
        LocalDate today = LocalDate.now();
        List<Payment> existingPayments = paymentRepository.findAllByLeaseId(event.leaseId());

        // Pending rent the new dates no longer cover was never owed. Paid and voided rows stay as history.
        List<Payment> obsolete = existingPayments.stream()
                .filter(payment -> payment.getStatus() == PaymentStatus.PENDING && !schedule.contains(payment.getDueDate()))
                .toList();
        paymentRepository.deleteAll(obsolete);

        // A rent change applies from today on; rent that is already due keeps the amount it was billed at.
        List<Payment> repriced = existingPayments.stream()
                .filter(payment -> payment.getStatus() == PaymentStatus.PENDING
                        && schedule.contains(payment.getDueDate())
                        && !payment.getDueDate().isBefore(today)
                        && !payment.getAmountCents().equals(event.monthlyRentCents()))
                .toList();
        repriced.forEach(payment -> payment.changeAmount(event.monthlyRentCents()));
        paymentRepository.saveAll(repriced);

        Set<LocalDate> coveredDueDates = existingPayments.stream()
                .filter(payment -> !obsolete.contains(payment))
                .map(Payment::getDueDate)
                .collect(Collectors.toSet());
        List<Payment> added = schedule.stream()
                .filter(dueDate -> !coveredDueDates.contains(dueDate))
                .map(dueDate -> new Payment(event.organizationId(), event.leaseId(), dueDate, event.monthlyRentCents()))
                .toList();
        paymentRepository.saveAll(added);
    }

    // Rent due after an ended lease's last day is no longer owed; arrears up to that day remain.
    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleLeaseEnded(LeaseEndedEvent event) {
        voidAll(paymentRepository.findAllByLeaseIdAndStatusAndDueDateAfter(event.leaseId(), PaymentStatus.PENDING, event.endDate()));
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleLeaseCancelled(LeaseCancelledEvent event) {
        voidAll(paymentRepository.findAllByLeaseIdAndStatus(event.leaseId(), PaymentStatus.PENDING));
    }

    private void voidAll(List<Payment> payments){
        payments.forEach(Payment::voidPayment);
        paymentRepository.saveAll(payments);
    }

    @Override
    public Long sumOverdueRent(Long organizationId, LocalDate beforeDate, Long propertyId) {
        return paymentRepository.sumOverdueRent(organizationId, beforeDate, PaymentStatus.PENDING.name(), propertyId);

    }

    @Override
    public Long sumOutstandingRent(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId){
        return paymentRepository.sumOutstandingRent(organizationId, startDate, endDate, PaymentStatus.PENDING.name(), propertyId);
    }

    @Override 
    public Long sumExpectedRent(Long organizationId,LocalDate startDate, LocalDate endDate, Long propertyId){
        return paymentRepository.sumExpectedRent(organizationId, startDate, endDate, PaymentStatus.VOIDED.name(), propertyId);
    }

    @Override 
    public Long sumPaidRent(Long organizationId, LocalDate startDate, LocalDate endDate, Long propertyId){
        return paymentRepository.sumByStatusForPeriod(organizationId, startDate, endDate, PaymentStatus.PAID.name(), propertyId);
    }

    @Override
    public Long countOverduePayments(Long organizationId, LocalDate beforeDate) {
        return paymentRepository.countOverduePayments(organizationId, beforeDate, PaymentStatus.PENDING);
    }
}
