package com.isabilalli.rentora.payment.api.dto;

// How many payments one Payments tab holds, and what they add up to.
public record PaymentStatusTotal(
        long count,
        long amountCents
) {
}
