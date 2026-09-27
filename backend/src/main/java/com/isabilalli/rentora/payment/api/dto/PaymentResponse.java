package com.isabilalli.rentora.payment.api.dto;

import com.isabilalli.rentora.payment.domain.Payment;
import com.isabilalli.rentora.payment.domain.PaymentMethod;
import com.isabilalli.rentora.payment.domain.PaymentStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record PaymentResponse(
        Long id,
        Long organizationId,
        Long leaseId,
        LocalDate dueDate,
        Long amountCents,
        PaymentStatus status,
        OffsetDateTime paidAt,
        PaymentMethod paymentMethod,
        Long recordedByUserId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrganizationId(),
                payment.getLeaseId(),
                payment.getDueDate(),
                payment.getAmountCents(),
                payment.getStatus(),
                payment.getPaidAt(),
                payment.getPaymentMethod(),
                payment.getRecordedByUserId(),
                payment.getCreatedAt(),
                payment.getUpdatedAt()
        );
    }
}