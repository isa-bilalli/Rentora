package com.isabilalli.rentora.registration.application;

import com.isabilalli.rentora.auth.application.UserService;
import com.isabilalli.rentora.auth.domain.User;
import com.isabilalli.rentora.auth.api.dto.CreateUserRequest;
import com.isabilalli.rentora.organization.application.OrganizationMembershipService;
import com.isabilalli.rentora.organization.application.OrganizationService;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
import com.isabilalli.rentora.registration.api.dto.RegisterRequest;
import com.isabilalli.rentora.registration.api.dto.RegistrationResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegistrationService {

    private final UserService userService;
    private final OrganizationService organizationService;
    private final OrganizationMembershipService membershipService;

    public RegistrationService(UserService userService, OrganizationService organizationService, OrganizationMembershipService membershipService) {
        this.userService = userService;
        this.organizationService = organizationService;
        this.membershipService = membershipService;
    }

    @Transactional
    public RegistrationResponse register(RegisterRequest request) {

        Organization organization = organizationService.createOrganization(request.organizationName());

        User user = userService.createUser(new CreateUserRequest(request.firstName(), request.lastName(), request.email(), request.password()));

        membershipService.createMembership(organization, user, OrganizationRole.OWNER);
        
        return new RegistrationResponse(user.getId(), organization.getId());
    }
}