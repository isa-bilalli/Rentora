package com.isabilalli.rentora.organization.domain;

import jakarta.persistence.*;
import com.isabilalli.rentora.auth.domain.User;
import java.time.OffsetDateTime;

@Entity 
@Table(
    name = "organization_memberships",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_membership_organization_user",
            columnNames = {"organization_id", "user_id"}
        )
    }
)
public class OrganizationMembership {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "organization_id",
        nullable = false
    )
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "user_id",
        nullable = false
    )
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OrganizationRole role;

    @Column(nullable = false)
    private OffsetDateTime createdAt;

    protected OrganizationMembership() {
    }

    public OrganizationMembership(
            Organization organization,
            User user,
            OrganizationRole role
    ) {
        this.organization = organization;
        this.user = user;
        this.role = role;
        this.createdAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public Organization getOrganization() {
        return organization;
    }

    public User getUser() {
        return user;
    }

    public OrganizationRole getRole() {
        return role;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}