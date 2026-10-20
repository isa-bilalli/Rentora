package com.isabilalli.rentora.organization.infrastructure;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.isabilalli.rentora.organization.domain.OrganizationMembership;

public interface OrganizationMembershipRepository extends JpaRepository<OrganizationMembership, Long>{
    boolean existsByUser_IdAndOrganization_Id(Long userId, Long organizationId);
    Optional<OrganizationMembership> findByUser_IdAndOrganization_Id(Long userId, Long organizationId);

    // Loads each member's user in the same query.
    @EntityGraph(attributePaths = "user")
    List<OrganizationMembership> findAllByOrganization_IdOrderByCreatedAtAsc(Long organizationId);
    List<OrganizationMembership> findAllByUserId_IdOrderByCreatedAtAsc(Long userId);
} 
