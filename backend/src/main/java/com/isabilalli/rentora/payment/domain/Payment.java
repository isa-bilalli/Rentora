package com.isabilalli.rentora.payment.domain;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.isabilalli.rentora.shared.api.BadRequestException;

import jakarta.persistence.*;

@Entity 
@Table (name = "payments")
public class Payment {
    
    @Id 
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(name = "lease_id", nullable = false)
    private Long leaseId;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Column(name = "amount_cents", nullable = false)
    private Long amountCents;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentStatus status;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 30)
    private PaymentMethod paymentMethod;

    @Column(name = "recorded_by_user_id")
    private Long recordedByUserId;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected Payment() {
    }

    public Payment(
            Long organizationId,
            Long leaseId,
            LocalDate dueDate,
            Long amountCents
    ) {
        this.organizationId = organizationId;
        this.leaseId = leaseId;
        this.dueDate = dueDate;
        this.amountCents = amountCents;
        this.status = PaymentStatus.PENDING;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public Long getLeaseId() {
        return leaseId;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public Long getAmountCents() {
        return amountCents;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public OffsetDateTime getPaidAt() {
        return paidAt;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public Long getRecordedByUserId() {
        return recordedByUserId;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void markPaid(OffsetDateTime paidAt, PaymentMethod paymentMethod, Long recordedByUserId){
        if(status != PaymentStatus.PENDING){
            throw new BadRequestException("Only pending payments can be marked as paid");
        }
        this.status=PaymentStatus.PAID;
        this.paidAt=paidAt;
        this.paymentMethod=paymentMethod;
        this.recordedByUserId=recordedByUserId;
        this.updatedAt=OffsetDateTime.now();
    }

    public void voidPayment(){
        if(status != PaymentStatus.PENDING){
            throw new BadRequestException("Only pending payments can be voided");
        }
        this.status=PaymentStatus.VOIDED;
        this.updatedAt=OffsetDateTime.now();
    }
}
