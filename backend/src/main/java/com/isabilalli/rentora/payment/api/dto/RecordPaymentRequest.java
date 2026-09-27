package com.isabilalli.rentora.payment.api.dto;

import com.isabilalli.rentora.payment.domain.PaymentMethod;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public record RecordPaymentRequest(

        @NotNull
        OffsetDateTime paidAt,

        @NotNull
        PaymentMethod paymentMethod
) {}