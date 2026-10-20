package com.isabilalli.rentora.payment.api;

import com.isabilalli.rentora.payment.api.dto.PaymentDisplayStatus;
import com.isabilalli.rentora.payment.api.dto.PaymentResponse;
import com.isabilalli.rentora.payment.api.dto.PaymentStatusTotal;
import com.isabilalli.rentora.payment.api.dto.RecordPaymentRequest;
import com.isabilalli.rentora.payment.application.PaymentService;
import com.isabilalli.rentora.payment.domain.PaymentStatus;
import com.isabilalli.rentora.shared.api.PageResponse;

import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;


@RestController
@RequestMapping("/api/organizations/{organizationId}/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getAllPaymentsByOrganizationId(@PathVariable Long organizationId){
        return ResponseEntity.ok(paymentService.getAllPaymentsByOrganizationId(organizationId));
    }

    // One page of a Payments tab, e.g. ?status=OVERDUE&page=0&size=25.
    @GetMapping("/page")
    public ResponseEntity<PageResponse<PaymentResponse>> getPaymentPage(
            @PathVariable Long organizationId,
            @RequestParam PaymentDisplayStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size
    ) {
        return ResponseEntity.ok(paymentService.getPaymentPage(organizationId, status, page, size));
    }

    // Count and total per Payments tab.
    @GetMapping("/summary")
    public ResponseEntity<Map<PaymentDisplayStatus, PaymentStatusTotal>> getPaymentSummary(@PathVariable Long organizationId) {
        return ResponseEntity.ok(paymentService.getPaymentSummary(organizationId));
    }
    
    @GetMapping("/leases/{leaseId}")
    public ResponseEntity<List<PaymentResponse>> getAllPaymentsByLeaseId(@PathVariable Long organizationId, @PathVariable Long leaseId) {
        return ResponseEntity.ok(paymentService.getAllPaymentsByLeaseId(organizationId, leaseId));
    }
    
    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> getPayment(@PathVariable Long organizationId, @PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.getPayment(organizationId, paymentId));
    }
    
    @PostMapping("/{paymentId}/record")
    public ResponseEntity<PaymentResponse> recordPayment(@PathVariable Long organizationId, @PathVariable Long paymentId, @Valid @RequestBody RecordPaymentRequest request) {
        return ResponseEntity.ok(paymentService.recordPayment(organizationId, paymentId, request));
    }
    
    @PostMapping("/{paymentId}/void")
    public ResponseEntity<PaymentResponse> voidPayment(@PathVariable Long organizationId, @PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.voidPayment(organizationId, paymentId));
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<PaymentResponse>> getOverdue(@PathVariable Long organizationId) {
        return ResponseEntity.ok(paymentService.getOverduePayments(organizationId));
    }
    @GetMapping("/status")
    public ResponseEntity<List<PaymentResponse>> getPaymentsByStatus(@PathVariable Long organizationId, @RequestParam PaymentStatus status) {
        return ResponseEntity.ok(paymentService.getByStatus(organizationId, status));
    }
    
}