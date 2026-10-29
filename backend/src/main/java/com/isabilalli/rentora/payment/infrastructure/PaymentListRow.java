package com.isabilalli.rentora.payment.infrastructure;

import com.isabilalli.rentora.payment.domain.Payment;

// A payment with what the Payments page shows beside it, as PaymentRepository.findListPage reads it.
public record PaymentListRow(
        Payment payment,
        Long tenantId,
        String tenantFirstName,
        String tenantLastName,
        String tenantCompanyName,
        String propertyName,
        String spaceName
) {
}
