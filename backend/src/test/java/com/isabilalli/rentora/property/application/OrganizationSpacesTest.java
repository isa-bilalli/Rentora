package com.isabilalli.rentora.property.application;

import com.isabilalli.rentora.auth.application.CurrentUserService;
import com.isabilalli.rentora.auth.infrastructure.security.AuthenticatedUser;
import com.isabilalli.rentora.lease.api.LeaseStatusAccess;
import com.isabilalli.rentora.organization.application.OrganizationAccessService;
import com.isabilalli.rentora.property.api.dto.SpaceResponse;
import com.isabilalli.rentora.property.domain.Space;
import com.isabilalli.rentora.property.domain.SpaceStatus;
import com.isabilalli.rentora.property.domain.SpaceType;
import com.isabilalli.rentora.property.infrastructure.PropertyRepository;
import com.isabilalli.rentora.property.infrastructure.SpaceRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

// The organization-wide spaces list. Its own class, because SpaceServiceTest's setup stubs lookups by ID
// that this list never makes, and strict stubbing would fail on them.
@ExtendWith(MockitoExtension.class)
class OrganizationSpacesTest {

    private static final Long ORGANIZATION_ID = 1L;

    @Mock
    private SpaceRepository spaceRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private OrganizationAccessService organizationAccessService;

    @Mock
    private LeaseStatusAccess leaseStatusAccess;

    @Mock
    private AuthenticatedUser authenticatedUser;

    private SpaceService spaceService;

    @BeforeEach
    void setUp() {
        spaceService = new SpaceService(
                spaceRepository,
                propertyRepository,
                currentUserService,
                organizationAccessService,
                leaseStatusAccess
        );

        when(currentUserService.getCurrentUser()).thenReturn(authenticatedUser);
    }

    @Test
    void listsTheOrganizationsSpacesForAMember() {
        Space space = new Space(10L, "Apartment 1", SpaceType.RESIDENTIAL, 2, new BigDecimal("75.50"), SpaceStatus.VACANT);
        when(spaceRepository.findAllByOrganizationId(ORGANIZATION_ID)).thenReturn(List.of(space));

        List<SpaceResponse> spaces = spaceService.getOrganizationSpaces(ORGANIZATION_ID);

        assertEquals(List.of("Apartment 1"), spaces.stream().map(SpaceResponse::name).toList());
        verify(organizationAccessService).requireAccess(authenticatedUser, ORGANIZATION_ID);
    }

    @Test
    void listsNothingForSomeoneOutsideTheOrganization() {
        doThrow(new AccessDeniedException("User does not have access to this organization"))
                .when(organizationAccessService).requireAccess(authenticatedUser, ORGANIZATION_ID);

        assertThrows(AccessDeniedException.class, () -> spaceService.getOrganizationSpaces(ORGANIZATION_ID));

        verify(spaceRepository, never()).findAllByOrganizationId(anyLong());
    }
}
