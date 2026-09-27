package com.isabilalli.rentora.lease.domain;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.isabilalli.rentora.shared.api.BadRequestException;

@Entity
@Table(name = "leases")
public class Lease {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(name = "tenant_id", nullable = false)
    private Long tenantId;

    @Column(name = "space_id", nullable = false)
    private Long spaceId;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "monthly_rent_cents", nullable = false)
    private Long monthlyRentCents;

    @Column(name = "security_deposit_cents", nullable = false)
    private Long securityDepositCents;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private LeaseStatus status;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected Lease() {
    }

    public Lease(
            Long organizationId,
            Long tenantId,
            Long spaceId,
            LocalDate startDate,
            LocalDate endDate,
            Long monthlyRentCents,
            Long securityDepositCents
    ) {
        this.organizationId = organizationId;
        this.tenantId = tenantId;
        this.spaceId = spaceId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.monthlyRentCents = monthlyRentCents;
        this.securityDepositCents = securityDepositCents;
        this.status = LeaseStatus.ACTIVE;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId(){
        return id;
    }

    public Long getOrganizationId(){
        return organizationId;
    }

    public Long getTenantId(){
        return tenantId;
    }

    public Long getSpaceId(){
        return spaceId;
    }

    public LocalDate getStartDate(){
        return startDate;
    }

    public LocalDate getEndDate(){
        return endDate;
    }

    public Long getMonthlyRentCents(){
        return monthlyRentCents;
    }

    public Long getSecurityDepositCents(){
        return securityDepositCents;
    }

    public LeaseStatus getStatus(){
        return status;
    }

    public OffsetDateTime getCreatedAt(){
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt(){
        return updatedAt;
    }

    public void update(LocalDate startDate, LocalDate endDate, Long monthlyRentCents, Long securityDepositCents) {
        if (startDate != null) {
            this.startDate = startDate;
        }

        if (endDate != null) {
            this.endDate = endDate;
        }

        if (monthlyRentCents != null) {
            this.monthlyRentCents = monthlyRentCents;
        }

        if (securityDepositCents != null) {
            this.securityDepositCents = securityDepositCents;
        }

        this.updatedAt = OffsetDateTime.now();
    }

    public void end(){
        if(status != LeaseStatus.ACTIVE){
            throw new BadRequestException("Only active leases can be ended");
        }
        this.status = LeaseStatus.ENDED;
        this.updatedAt = OffsetDateTime.now();
    }

    public void cancel(){
        if(status != LeaseStatus.ACTIVE){
            throw new BadRequestException("Only active leases can be cancelled");
        }
        this.status = LeaseStatus.CANCELLED;
        this.updatedAt=OffsetDateTime.now();
    }
}