package com.isabilalli.rentora.organization.application;

import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import org.springframework.stereotype.Service;

@Service
public class OrganizationService {
    private final OrganizationRepository organizationRepository;

    public OrganizationService(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    public Organization createOrganization(String name) {
        Organization organization = new Organization(name);

        return organizationRepository.save(organization);
    }
}
