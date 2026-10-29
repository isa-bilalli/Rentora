package com.isabilalli.rentora.payment.api.dto;

// One row of the Payments page: the payment, with the names of its lease's tenant, property and space, so the
// page needn't load every lease, tenant, property and space to find them.
public record PaymentListItem(
        PaymentResponse payment,
        String tenantName,
        String propertyName,
        String spaceName
) {
}
