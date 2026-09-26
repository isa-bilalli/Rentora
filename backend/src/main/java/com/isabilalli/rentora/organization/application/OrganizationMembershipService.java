package com.isabilalli.rentora.organization.application;

import com.isabilalli.rentora.auth.domain.User;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.domain.OrganizationMembership;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
import com.isabilalli.rentora.organization.infrastructure.OrganizationMembershipRepository;
import org.springframework.stereotype.Service;

@Service 
public class OrganizationMembershipService {

    private final OrganizationMembershipRepository membershipRepository;

    public OrganizationMembershipService(
            OrganizationMembershipRepository membershipRepository
    ) {
        this.membershipRepository = membershipRepository;
    }

    public OrganizationMembership createMembership(
            Organization organization,
            User user,
            OrganizationRole role
    ) {
        OrganizationMembership membership =
                new OrganizationMembership(
                        organization,
                        user,
                        role
                );

        return membershipRepository.save(membership);
    }
}
