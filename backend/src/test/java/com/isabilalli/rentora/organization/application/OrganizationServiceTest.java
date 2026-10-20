package com.isabilalli.rentora.organization.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.application.UserService;
import com.isabilalli.rentora.auth.domain.User;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.organization.api.dto.AddMemberRequest;
import com.isabilalli.rentora.organization.api.dto.MemberResponse;
import com.isabilalli.rentora.organization.domain.Organization;
import com.isabilalli.rentora.organization.domain.OrganizationMembership;
import com.isabilalli.rentora.organization.domain.OrganizationRole;
import com.isabilalli.rentora.organization.infrastructure.OrganizationMembershipRepository;
import com.isabilalli.rentora.organization.infrastructure.OrganizationRepository;
import com.isabilalli.rentora.shared.api.BadRequestException;
import com.isabilalli.rentora.shared.api.ConflictException;
import com.isabilalli.rentora.shared.api.NotFoundException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    private static final Long ORGANIZATION_ID = 2L;
    private static final Long NEW_MEMBER_ID = 3L;
    private static final String EMAIL = "new.member@example.com";

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private OrganizationMembershipRepository membershipRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private UserService userService;

    @Mock
    private AuthenticatedUser currentUser;

    @Mock
    private User newMember;

    private OrganizationService organizationService;

    @BeforeEach
    void setUp() {
        organizationService = new OrganizationService(organizationRepository, membershipRepository, currentUserService, organizationAccessService, userService);
        when(currentUserService.getCurrentUser()).thenReturn(currentUser);
    }

    @Test
    void addsAnExistingAccountWithTheChosenRole() {
        when(userService.findByEmail(EMAIL)).thenReturn(Optional.of(newMember));
        when(newMember.getId()).thenReturn(NEW_MEMBER_ID);
        when(membershipRepository.existsByUser_IdAndOrganization_Id(NEW_MEMBER_ID, ORGANIZATION_ID)).thenReturn(false);
        when(organizationRepository.findById(ORGANIZATION_ID)).thenReturn(Optional.of(new Organization("Test org")));
        when(membershipRepository.save(any(OrganizationMembership.class))).thenAnswer(invocation -> invocation.getArgument(0));

        MemberResponse response = organizationService.addMember(ORGANIZATION_ID, new AddMemberRequest(EMAIL, OrganizationRole.MEMBER));

        verify(organizationAccessService).requireRole(currentUser, ORGANIZATION_ID, OrganizationRole.MANAGER);
        assertEquals(NEW_MEMBER_ID, response.userId());
        assertEquals(OrganizationRole.MEMBER, response.role());
    }

    @Test
    void memberCannotAddPeople() {
        doThrow(new AccessDeniedException("Your role in this organization does not allow this action"))
                .when(organizationAccessService).requireRole(currentUser, ORGANIZATION_ID, OrganizationRole.MANAGER);

        assertThrows(
                AccessDeniedException.class,
                () -> organizationService.addMember(ORGANIZATION_ID, new AddMemberRequest(EMAIL, OrganizationRole.MEMBER))
        );

        verify(membershipRepository, never()).save(any());
    }

    @Test
    void nobodyIsAddedAsOwner() {
        assertThrows(
                BadRequestException.class,
                () -> organizationService.addMember(ORGANIZATION_ID, new AddMemberRequest(EMAIL, OrganizationRole.OWNER))
        );

        verify(membershipRepository, never()).save(any());
    }

    @Test
    void emailWithoutAnAccountIsNotFound() {
        when(userService.findByEmail(EMAIL)).thenReturn(Optional.empty());

        assertThrows(
                NotFoundException.class,
                () -> organizationService.addMember(ORGANIZATION_ID, new AddMemberRequest(EMAIL, OrganizationRole.MEMBER))
        );

        verify(membershipRepository, never()).save(any());
    }

    @Test
    void existingMemberIsNotAddedTwice() {
        when(userService.findByEmail(EMAIL)).thenReturn(Optional.of(newMember));
        when(newMember.getId()).thenReturn(NEW_MEMBER_ID);
        when(membershipRepository.existsByUser_IdAndOrganization_Id(NEW_MEMBER_ID, ORGANIZATION_ID)).thenReturn(true);

        assertThrows(
                ConflictException.class,
                () -> organizationService.addMember(ORGANIZATION_ID, new AddMemberRequest(EMAIL, OrganizationRole.MANAGER))
        );

        verify(membershipRepository, never()).save(any());
    }

    @Test
    void listingMembersOnlyNeedsMembership() {
        organizationService.getMembers(ORGANIZATION_ID);

        verify(organizationAccessService).requireAccess(currentUser, ORGANIZATION_ID);
        verify(membershipRepository).findAllByOrganization_IdOrderByCreatedAtAsc(ORGANIZATION_ID);
    }
}
