package com.isabilalli.rentora.organization.application;

import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
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

    // Membership plus a role of at least `minimum`, e.g. MANAGER lets managers and owners through.
    public void requireRole(AuthenticatedUser user, Long organizationId, OrganizationRole minimum) {
        OrganizationRole role = membershipService.findRole(user.userId(), organizationId)
                .orElseThrow(() -> new AccessDeniedException("User does not have access to this organization"));
        if (!role.isAtLeast(minimum)) {
            throw new AccessDeniedException("Your role in this organization does not allow this action");
        }
    }
}