package com.isabilalli.rentora.payment.application;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.isabilalli.rentora.lease.api.event.LeaseCreatedEvent;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.lease.api.LeaseAccess;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.payment.api.PaymentAccess;
import com.isabilalli.rentora.payment.api.dto.PaymentResponse;
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
        organizationAuthorization(organizationId);
        Payment payment = validatePayment(paymentId, organizationId);
        payment.voidPayment();
        Payment savedPayment = paymentRepository.save(payment);
        return PaymentResponse.from(savedPayment);
    }

    public List<PaymentResponse> getOverduePayments(Long organizationId){
        organizationAuthorization(organizationId);
        return paymentRepository.findAllByOrganizationIdAndStatusAndDueDateBefore(organizationId, PaymentStatus.PENDING, LocalDate.now()).stream().map(PaymentResponse::from).toList();
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
        Payment payment = paymentRepository.findById(paymentId).orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (!payment.getOrganizationId().equals(organizationId)) {
            throw new AccessDeniedException("Payment does not belong to this organization");
        }
        return payment;
    }

    public List<PaymentResponse> getAllPaymentsByOrganizationId(Long organizationId){
        organizationAuthorization(organizationId);
        return paymentRepository.findAllByOrganizationId(organizationId).stream().map(PaymentResponse::from).toList();
    }

    public List<PaymentResponse> getAllPaymentsByLeaseId(Long organizationId, Long leaseId){
        organizationAuthorization(organizationId);
        leaseAccess.requireBelongsToOrganization(leaseId, organizationId);
        return paymentRepository.findAllByLeaseId(leaseId).stream().map(PaymentResponse::from).toList();
    }

    public List<PaymentResponse> getAllPaymentsByStatus(Long organizationId, PaymentStatus status){
        organizationAuthorization(organizationId);
        return paymentRepository.findAllByStatus(status).stream().map(PaymentResponse::from).toList();
    }

    @Override
    public void generateRentObligations(Long organizationId, Long leaseId, LocalDate startDate, LocalDate endDate, Long monthlyRentCents) {
        List<Payment> existingPayments = paymentRepository.findAllByLeaseId(leaseId);
        java.util.Set<LocalDate> existingDueDates = existingPayments.stream().map(Payment::getDueDate).collect(java.util.stream.Collectors.toSet());
        List<Payment> payments = new ArrayList<>();
        
        int dueDay = startDate.getDayOfMonth();
        LocalDate month = startDate.withDayOfMonth(1);
    
        while(!month.isAfter(endDate)){
            int actualDay = Math.min(dueDay, month.lengthOfMonth());
            LocalDate dueDate = month.withDayOfMonth(actualDay);
            if (!dueDate.isBefore(startDate) && !dueDate.isAfter(endDate) && !existingDueDates.contains(dueDate)) {
            payments.add(new Payment( organizationId, leaseId, dueDate, monthlyRentCents));}
            month = month.plusMonths(1);
        }
        if(!payments.isEmpty()){
            paymentRepository.saveAll(payments);
        }
    }

    @TransactionalEventListener(phase = TransactionPhase.BEFORE_COMMIT)
    public void handleLeaseCreated(LeaseCreatedEvent event) {
        generateRentObligations(event.organizationId(), event.leaseId(), event.startDate(), event.endDate(), event.monthlyRentCents());
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
