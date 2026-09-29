package com.isabilalli.rentora.expense.domain;

import com.isabilalli.rentora.shared.api.BadRequestException;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "space_id")
    private Long spaceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExpenseCategory category;

    @Column(name = "vendor_name", length = 150)
    private String vendorName;

    @Column(length = 500)
    private String description;

    @Column(name = "amount_cents", nullable = false)
    private Long amountCents;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(nullable = false)
    private boolean paid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExpenseStatus status;

    @Column(name = "recorded_by_user_id")
    private Long recordedByUserId;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected Expense() {
    }

    public Expense(Long organizationId, Long propertyId, Long spaceId, ExpenseCategory category, String vendorName, String description, Long amountCents, LocalDate expenseDate, Long recordedByUserId){
        this.organizationId = organizationId;
        this.propertyId = propertyId;
        this.spaceId = spaceId;
        this.category = category;
        this.vendorName = vendorName;
        this.description = description;
        this.amountCents = amountCents;
        this.expenseDate = expenseDate;
        this.paid = false;
        this.status = ExpenseStatus.RECORDED;
        this.recordedByUserId = recordedByUserId;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public void markPaid() {
        if (status != ExpenseStatus.RECORDED) {
            throw new BadRequestException("Only recorded expenses can be marked as paid");
        }
        this.paid = true;
        this.updatedAt = OffsetDateTime.now();
    }

    public void voidExpense() {
        if (status != ExpenseStatus.RECORDED) {
            throw new BadRequestException("Only recorded expenses can be voided");
        }
        this.status = ExpenseStatus.VOIDED;
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId(){
        return id;
    }

    public Long getOrganizationId(){
        return organizationId;
    }

    public Long getPropertyId(){
        return propertyId;
    }

    public Long getSpaceId(){
        return spaceId;
    }

    public ExpenseCategory getCategory(){
        return category;
    }

    public String getVendorName(){
        return vendorName;
    }

    public String getDescription(){
        return description;
    }

    public Long getAmountCents(){
        return amountCents;
    }

    public LocalDate getExpenseDate(){
        return expenseDate;
    }

    public Long getRecordedByUserId(){
        return recordedByUserId;
    }

    public boolean isPaid(){
        return paid;
    }

    public ExpenseStatus getStatus(){
        return status;
    }

    public OffsetDateTime getCreatedAt(){
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt(){
        return updatedAt;
    }

    public void update(ExpenseCategory category, String vendorName, String description, Long amountCents, LocalDate expenseDate){
        if (status != ExpenseStatus.RECORDED) {
            throw new BadRequestException("Only recorded expenses can be updated");
        }

        if (category != null) {
            this.category = category;
        }

        if (vendorName != null) {
            this.vendorName = vendorName;
        }

        if (description != null) {
            this.description = description;
        }

        if (amountCents != null) {
            this.amountCents = amountCents;
        }

        if (expenseDate != null) {
            this.expenseDate = expenseDate;
        }

        this.updatedAt = OffsetDateTime.now();
    }
}