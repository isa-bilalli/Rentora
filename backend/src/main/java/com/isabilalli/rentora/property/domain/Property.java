package com.isabilalli.rentora.property.domain;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "properties")
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "address_line", nullable = false, length = 255)
    private String addressLine;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(nullable = false, length = 100)
    private String country;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected Property() {
    }

    public Property(
            Long organizationId,
            String name,
            String addressLine,
            String city,
            String postalCode,
            String country
    ) {
        this.organizationId = organizationId;
        this.name = name;
        this.addressLine = addressLine;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Long getOrganizationId() {
        return organizationId;
    }

    public String getName() {
        return name;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public String getCity() {
        return city;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public String getCountry() {
        return country;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}