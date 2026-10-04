package com.isabilalli.rentora.organization.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.organization.api.dto.OrganizationResponse;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.infrastructure.OrganizationMembershipRepository;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationService {
    private final OrganizationRepository organizationRepository;
    private final OrganizationMembershipRepository organizationMembershipRepository;
    private final CurrentUserService currentUserService;

    public OrganizationService(OrganizationRepository organizationRepository, OrganizationMembershipRepository organizationMembershipRepository, CurrentUserService currentUserService) {
        this.organizationRepository = organizationRepository;
        this.organizationMembershipRepository = organizationMembershipRepository;
        this.currentUserService = currentUserService;
    }

    public Organization createOrganization(String name) {
        Organization organization = new Organization(name);

        return organizationRepository.save(organization);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> getMyOrganizations(){
        Long userId = currentUserService.getCurrentUser().userId();
        return organizationMembershipRepository.findAllByUserId_IdOrderByCreatedAtAsc(userId).stream().map(membership -> new OrganizationResponse(membership.getOrganization().getId(), membership.getOrganization().getName())).toList();
    }
}
