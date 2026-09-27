package com.isabilalli.rentora.property.domain;

import com.isabilalli.rentora.shared.api.BadRequestException;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "spaces")
public class Space {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "property_id", nullable = false)
    private Long propertyId;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SpaceType type;

    private Integer floor;

    @Column(precision = 10, scale = 2)
    private BigDecimal area;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SpaceStatus status;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected Space() {}

    public Space(
            Long propertyId,
            String name,
            SpaceType type,
            Integer floor,
            BigDecimal area,
            SpaceStatus status
    ) {
        this.propertyId = propertyId;
        this.name = name;
        this.type = type;
        this.floor = floor;
        this.area = area;
        this.status = status;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getPropertyId() {
        return propertyId;
    }

    public String getName() {
        return name;
    }

    public SpaceType getType() {
        return type;
    }

    public Integer getFloor() {
        return floor;
    }

    public BigDecimal getArea() {
        return area;
    }

    public SpaceStatus getStatus() {
        return status;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void update(String name, SpaceType type, Integer floor, BigDecimal area){
        if (name != null) {
            this.name = name;
        }
        if (type != null) {
            this.type = type;
        }
        if (floor != null) {
            this.floor = floor;
        }
        if (area != null) {
            this.area = area;
        }
        this.updatedAt = OffsetDateTime.now();
    }

    public void markReserved() {
        if (this.status != SpaceStatus.VACANT && this.status != SpaceStatus.OCCUPIED) {
            throw new BadRequestException("Space cannot be reserved in its current state");
        }
        this.status = SpaceStatus.RESERVED;
        this.updatedAt = OffsetDateTime.now();
    }

    public void markOccupied() {
        if (this.status != SpaceStatus.VACANT && this.status != SpaceStatus.RESERVED) {
            throw new BadRequestException("Space is not available for occupancy");
        }
        this.status = SpaceStatus.OCCUPIED;
        this.updatedAt = OffsetDateTime.now();
    }

    public void markMaintenance() {
        if (this.status != SpaceStatus.VACANT) {
            throw new BadRequestException("Only vacant spaces can be put into maintenance");
        }
        this.status = SpaceStatus.MAINTENANCE;
        this.updatedAt = OffsetDateTime.now();
    }

    public void markVacant() {
        if (this.status != SpaceStatus.OCCUPIED && this.status != SpaceStatus.RESERVED && this.status != SpaceStatus.MAINTENANCE) {
            throw new BadRequestException("Space is already vacant");
        }
        this.status = SpaceStatus.VACANT;
        this.updatedAt = OffsetDateTime.now();
    }
}