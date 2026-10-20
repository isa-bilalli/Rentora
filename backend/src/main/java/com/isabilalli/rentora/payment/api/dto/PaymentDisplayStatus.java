package com.isabilalli.rentora.payment.api.dto;

// The Payments page's tabs. OVERDUE is not stored: it is a PENDING payment whose due date is before today,
// and PENDING then means due today or later.
public enum PaymentDisplayStatus {
    OVERDUE,
    PENDING,
    PAID,
    VOIDED
}
