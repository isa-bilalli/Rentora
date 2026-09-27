package com.isabilalli.rentora.payment.api;

import com.isabilalli.rentora.payment.api.dto.PaymentResponse;
import com.isabilalli.rentora.payment.api.dto.RecordPaymentRequest;
import com.isabilalli.rentora.payment.application.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/organizations/{organizationId}/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/{paymentId}/record")
    public ResponseEntity<PaymentResponse> recordPayment(@PathVariable Long organizationId, @PathVariable Long paymentId, @Valid @RequestBody RecordPaymentRequest request) {
        return ResponseEntity.ok(paymentService.recordPayment(organizationId, paymentId, request));
    }
}