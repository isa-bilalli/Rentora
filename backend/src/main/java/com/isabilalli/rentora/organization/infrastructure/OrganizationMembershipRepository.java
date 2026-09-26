package com.isabilalli.rentora.organization.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import com.isabilalli.rentora.organization.domain.OrganizationMembership;

public interface OrganizationMembershipRepository extends JpaRepository<OrganizationMembership, Long>{
    
} 
