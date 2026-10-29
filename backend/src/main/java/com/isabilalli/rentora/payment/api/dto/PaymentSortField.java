package com.isabilalli.rentora.payment.api.dto;

// The Payments page's sortable columns, as ?sort= takes them. Any other value is a 400.
public enum PaymentSortField {
    DUE_DATE,
    AMOUNT,
    PAID_AT
}
