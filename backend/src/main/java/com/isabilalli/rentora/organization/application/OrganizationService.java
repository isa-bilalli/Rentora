package com.isabilalli.rentora.organization.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.application.UserService;
import com.isabilalli.rentora.auth.domain.User;
import com.isabilalli.rentora.organization.api.dto.AddMemberRequest;
import com.isabilalli.rentora.organization.api.dto.MemberResponse;
import com.isabilalli.rentora.organization.api.dto.OrganizationResponse;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.domain.OrganizationMembership;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
import com.isabilalli.rentora.organization.infrastructure.OrganizationMembershipRepository;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.shared.api.BadRequestException;
import com.isabilalli.rentora.shared.api.ConflictException;
import com.isabilalli.rentora.shared.api.NotFoundException;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrganizationService {
    private final OrganizationRepository organizationRepository;
    private final OrganizationMembershipRepository organizationMembershipRepository;
    private final CurrentUserService currentUserService;
    private final OrganizationAccessService organizationAccessService;
    private final UserService userService;

    public OrganizationService(OrganizationRepository organizationRepository, OrganizationMembershipRepository organizationMembershipRepository, CurrentUserService currentUserService, OrganizationAccessService organizationAccessService, UserService userService) {
        this.organizationRepository = organizationRepository;
        this.organizationMembershipRepository = organizationMembershipRepository;
        this.currentUserService = currentUserService;
        this.organizationAccessService = organizationAccessService;
        this.userService = userService;
    }

    public Organization createOrganization(String name) {
        Organization organization = new Organization(name);

        return organizationRepository.save(organization);
    }

    @Transactional(readOnly = true)
    public List<OrganizationResponse> getMyOrganizations(){
        Long userId = currentUserService.getCurrentUser().userId();
        return organizationMembershipRepository.findAllByUserId_IdOrderByCreatedAtAsc(userId).stream().map(membership -> new OrganizationResponse(membership.getOrganization().getId(), membership.getOrganization().getName(), membership.getRole())).toList();
    }

    // Everyone in the organization can see who else is in it, oldest member first.
    @Transactional(readOnly = true)
    public List<MemberResponse> getMembers(Long organizationId) {
        organizationAccessService.requireAccess(currentUserService.getCurrentUser(), organizationId);
        return organizationMembershipRepository.findAllByOrganization_IdOrderByCreatedAtAsc(organizationId).stream()
                .map(MemberResponse::from)
                .toList();
    }

    // Adds someone who already has an account, straight away. There is no pending invitation to accept,
    // because the app can't send email yet. Owners and managers may add; see docs/ROLES.md.
    @Transactional
    public MemberResponse addMember(Long organizationId, AddMemberRequest request) {
        organizationAccessService.requireRole(currentUserService.getCurrentUser(), organizationId, OrganizationRole.MANAGER);
        if (request.role() == OrganizationRole.OWNER) {
            throw new BadRequestException("People can be added as managers or members, not as owners");
        }

        User user = userService.findByEmail(request.email())
                .orElseThrow(() -> new NotFoundException("No Rentora account uses this email; ask them to sign up first"));
        if (organizationMembershipRepository.existsByUser_IdAndOrganization_Id(user.getId(), organizationId)) {
            throw new ConflictException("This person is already a member of the organization");
        }

        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new NotFoundException("Organization not found"));
        OrganizationMembership membership = organizationMembershipRepository.save(new OrganizationMembership(organization, user, request.role()));
        return MemberResponse.from(membership);
    }
}
