package com.isabilalli.rentora.organization.infrastructure;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.isabilalli.rentora.organization.domain.OrganizationMembership;

public interface OrganizationMembershipRepository extends JpaRepository<OrganizationMembership, Long>{
    boolean existsByUser_IdAndOrganization_Id(Long userId, Long organizationId);
    List<OrganizationMembership> findAllByUserId_IdOrderByCreatedAtAsc(Long userId);
} 
