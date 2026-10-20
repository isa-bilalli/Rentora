package com.isabilalli.rentora.organization.application;

import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.organization.domain.OrganizationRole;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

// requireRole with MANAGER, as the destructive actions use it (docs/ROLES.md).
@ExtendWith(MockitoExtension.class)
class OrganizationAccessServiceTest {

    private static final Long USER_ID = 3L;
    private static final Long ORGANIZATION_ID = 2L;

    @Mock
    private OrganizationMembershipService membershipService;

    @Mock
    private AuthenticatedUser user;

    private OrganizationAccessService accessService;

    @BeforeEach
    void setUp() {
        accessService = new OrganizationAccessService(membershipService);
        when(user.userId()).thenReturn(USER_ID);
    }

    @Test
    void ownerMayDoWhatAManagerMay() {
        withRole(OrganizationRole.OWNER);

        assertDoesNotThrow(() -> accessService.requireRole(user, ORGANIZATION_ID, OrganizationRole.MANAGER));
    }

    @Test
    void managerMayDoWhatAManagerMay() {
        withRole(OrganizationRole.MANAGER);

        assertDoesNotThrow(() -> accessService.requireRole(user, ORGANIZATION_ID, OrganizationRole.MANAGER));
    }

    @Test
    void memberIsRefused() {
        withRole(OrganizationRole.MEMBER);

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> accessService.requireRole(user, ORGANIZATION_ID, OrganizationRole.MANAGER)
        );
        assertEquals("Your role in this organization does not allow this action", exception.getMessage());
    }

    @Test
    void nonMemberIsRefusedAsBefore() {
        when(membershipService.findRole(USER_ID, ORGANIZATION_ID)).thenReturn(Optional.empty());

        AccessDeniedException exception = assertThrows(
                AccessDeniedException.class,
                () -> accessService.requireRole(user, ORGANIZATION_ID, OrganizationRole.MANAGER)
        );
        assertEquals("User does not have access to this organization", exception.getMessage());
    }

    private void withRole(OrganizationRole role) {
        when(membershipService.findRole(USER_ID, ORGANIZATION_ID)).thenReturn(Optional.of(role));
    }
}
