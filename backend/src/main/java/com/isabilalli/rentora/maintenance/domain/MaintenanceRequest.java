package com.isabilalli.rentora.maintenance.domain;

import com.isabilalli.rentora.shared.api.BadRequestException;
import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "maintenance_requests")
public class MaintenanceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(name = "space_id")
    private Long spaceId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MaintenancePriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MaintenanceStatus status;

    @Column(name = "reported_at", nullable = false)
    private OffsetDateTime reportedAt;

    @Column(name = "resolved_at")
    private OffsetDateTime resolvedAt;

    @Column(name = "reported_by_user_id")
    private Long reportedByUserId;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    protected MaintenanceRequest() {
    }

    public MaintenanceRequest(Long organizationId, Long propertyId, Long spaceId, String title, String description, MaintenancePriority priority, Long reportedByUserId) {
        this.organizationId = organizationId;
        this.propertyId = propertyId;
        this.spaceId = spaceId;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.status = MaintenanceStatus.OPEN;
        this.reportedAt = OffsetDateTime.now();
        this.reportedByUserId = reportedByUserId;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public void startProgress() {
        if (status != MaintenanceStatus.OPEN) {
            throw new BadRequestException("Only open maintenance requests can be started");
        }
        this.status = MaintenanceStatus.IN_PROGRESS;
        this.updatedAt = OffsetDateTime.now();
    }

    public void resolve() {
        if (status != MaintenanceStatus.IN_PROGRESS) {
            throw new BadRequestException("Only in-progress maintenance requests can be resolved");
        }

        this.status = MaintenanceStatus.RESOLVED;
        this.resolvedAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public void cancel() {
        if (status != MaintenanceStatus.OPEN && status != MaintenanceStatus.IN_PROGRESS) {
            throw new BadRequestException("Only open or in-progress maintenance requests can be cancelled");
        }
        this.status = MaintenanceStatus.CANCELLED;
        this.cancelledAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public Long getPropertyId() {
        return propertyId;
    }

    public Long getSpaceId() {
        return spaceId;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public MaintenancePriority getPriority() {
        return priority;
    }

    public MaintenanceStatus getStatus() {
        return status;
    }

    public OffsetDateTime getReportedAt() {
        return reportedAt;
    }

    public OffsetDateTime getResolvedAt() {
        return resolvedAt;
    }

    public Long getReportedByUserId() {
        return reportedByUserId;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public OffsetDateTime getCancelledAt(){
        return cancelledAt;
    }

    public void update(String title, String description, MaintenancePriority priority){
        if(status != MaintenanceStatus.OPEN && status != MaintenanceStatus.IN_PROGRESS){
            throw new BadRequestException("Only open or in-progress maintenance requests can be updated");
        }
    
        if(title != null){
            this.title=title;
        }

        if(description != null){
            this.description=description;
        }

        if(priority != null){
            this.priority=priority;
        }
        
        this.updatedAt=OffsetDateTime.now();
    }
}