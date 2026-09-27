package com.isabilalli.rentora.payment.application;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.payment.api.PaymentAccess;
import com.isabilalli.rentora.payment.api.dto.PaymentResponse;
import com.isabilalli.rentora.payment.api.dto.RecordPaymentRequest;
import com.isabilalli.rentora.payment.domain.Payment;
import com.isabilalli.rentora.payment.infrastructure.PaymentRepository;

@Service 
public class PaymentService implements PaymentAccess {
    private final PaymentRepository paymentRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;

    public PaymentService(PaymentRepository paymentRepository, CurrentUserService currentUserService, OrganizationAccessService organizationAccessService){
        this.paymentRepository=paymentRepository;
        this.currentUserService=currentUserService;
        this.organizationAccessService=organizationAccessService;
    }

    public PaymentResponse recordPayment(Long organizationId, Long paymentId, RecordPaymentRequest request){
        AuthenticatedUser currentUser = organizationAuthorization(organizationId);
        Payment payment = validatePayment(paymentId, organizationId);
        
        payment.markPaid(request.paidAt(), request.paymentMethod(), currentUser.userId());
        Payment savedPayment = paymentRepository.save(payment);
        return PaymentResponse.from(savedPayment);
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

    @Override
    public void generateRentObligations(Long organizationId, Long leaseId, LocalDate startDate, LocalDate endDate, Long monthlyRentCents) {
        List<Payment> payments = new ArrayList<>();
        int dueDay = startDate.getDayOfMonth();
        LocalDate month = startDate.withDayOfMonth(1);
        while (!month.isAfter(endDate)) {
            int actualDay = Math.min(
                dueDay,
                month.lengthOfMonth()
            );
            LocalDate dueDate = month.withDayOfMonth(actualDay);
            if (!dueDate.isBefore(startDate) && !dueDate.isAfter(endDate)) {
                payments.add(new Payment(organizationId, leaseId, dueDate, monthlyRentCents));
            }
            month = month.plusMonths(1);
        }
        paymentRepository.saveAll(payments);
    }
}
