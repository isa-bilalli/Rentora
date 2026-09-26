package com.isabilalli.rentora.tenant.domain;

import jakarta.persistence.*;

import java.time.OffsetDateTime;

@Entity 
@Table (name = "tenants")
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "organization_id", nullable = false)
    private Long organizationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TenantType type;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "company_name", length = 150)
    private String companyName;

    @Column(length = 255)
    private String email;

    @Column(length = 50)
    private String phone;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    protected Tenant() {
    }

    public Tenant(
            Long organizationId,
            TenantType type,
            String firstName,
            String lastName,
            String companyName,
            String email,
            String phone
    ) {
        this.organizationId = organizationId;
        this.type = type;
        this.firstName = firstName;
        this.lastName = lastName;
        this.companyName = companyName;
        this.email = email;
        this.phone = phone;
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }
    public Long getId(){
        return id;
    }

    public Long getOrganizationId(){
        return organizationId;
    }

    public TenantType getType(){
        return type;
    }

    public String getFirstName(){
        return firstName;
    }

    public String getLastName(){
        return lastName;
    }

    public String getCompanyName(){
        return companyName;
    }

    public String getEmail(){
        return email;
    }

    public String getPhone(){
        return phone;
    }

    public OffsetDateTime getCreatedAt(){
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt(){
        return updatedAt;
    }

    public void update(TenantType type, String firstName, String lastName, String companyName, String email, String phone){
        if (type != null) {
        this.type = type;
        }

        if (firstName != null) {
            this.firstName = firstName;
        }

        if (lastName != null) {
            this.lastName = lastName;
        }

        if (companyName != null) {
            this.companyName = companyName;
        }

        if (email != null) {
            this.email = email;
        }

        if (phone != null) {
            this.phone = phone;
        }
        this.updatedAt = OffsetDateTime.now();
    }
}