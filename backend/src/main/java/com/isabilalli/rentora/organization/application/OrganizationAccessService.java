package com.isabilalli.rentora.organization.application;

import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
public class OrganizationAccessService {
    private final OrganizationMembershipService membershipService;

    public OrganizationAccessService(OrganizationMembershipService membershipService) {
        this.membershipService = membershipService;
    }

    public void requireAccess(AuthenticatedUser user, Long organizationId) {
        boolean isMember = membershipService.isMember(user.userId(), organizationId);
        if (!isMember) {
            throw new AccessDeniedException("User does not have access to this organization");
        }
    }
}