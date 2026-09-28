package com.isabilalli.rentora.payment.infrastructure;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.isabilalli.rentora.payment.domain.Payment;
import com.isabilalli.rentora.payment.domain.PaymentStatus;

public interface PaymentRepository extends JpaRepository<Payment, Long>{
    List<Payment> findAllByOrganizationId(Long organizationId);
    List<Payment> findAllByLeaseId(Long leaseId);
    List<Payment> findAllByStatus(PaymentStatus status);
    List<Payment> findAllByOrganizationIdAndStatusAndDueDateBefore(Long organizationId, PaymentStatus status, LocalDate date);
    List<Payment> findAllByOrganizationIdAndStatus(Long organizationId, PaymentStatus status);
}