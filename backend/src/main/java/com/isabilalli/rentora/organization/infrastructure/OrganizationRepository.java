package com.isabilalli.rentora.organization.infrastructure;

import org.springframework.data.jpa.repository.JpaRepository;

import com.isabilalli.rentora.organization.domain.Organization;

public interface OrganizationRepository extends JpaRepository<Organization, Long>{
    
}
